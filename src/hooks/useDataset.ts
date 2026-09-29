import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset } from "../core/models/dataset";
import { parseEvec } from "../core/parsers/parseEvec";
import { createExample } from "../core/parsers/example";
import {
  readEmbeddedArchive,
  type Archive,
} from "../services/export/archiveService";

export function useDataset() {
  const [archive, setArchive] = useState<Archive | null>(() =>
    readEmbeddedArchive(),
  );
  const [dataset, setDataset] = useState<Dataset | null>(
    () => archive?.dataset ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const loadId = useRef(0);
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const load = useCallback(
    (file: File) => {
      const id = ++loadId.current;
      worker.current?.terminate();
      setLoading(false);
      setError("");

      if (!/\.evec$/i.test(file.name)) {
        setError("Choose a file with the .evec extension.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(
          "This file exceeds the 50 MB limit. Please use a smaller .evec file.",
        );
        return;
      }

      setLoading(true);

      if (archive) {
        void file
          .text()
          .then((text) => {
            if (id !== loadId.current) return;
            setDataset(parseEvec(text, file.name));
            setArchive(null);
            setRevision((v) => v + 1);
            setLoading(false);
          })
          .catch((err) => {
            if (id === loadId.current) {
              setError(
                err instanceof Error ? err.message : "Unable to read file.",
              );
              setLoading(false);
            }
          });
        return;
      }

      const next = new Worker(
        new URL("../workers/evec.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = next;

      next.onmessage = (
        event: MessageEvent<{ dataset?: Dataset; error?: string }>,
      ) => {
        if (event.data.dataset) {
          setDataset(event.data.dataset);
          setArchive(null);
          setRevision((v) => v + 1);
        }
        setError(event.data.error ?? "");
        setLoading(false);
        next.terminate();
        worker.current = null;
      };

      next.onerror = () => {
        setError(
          "The file reader could not start. Refresh the page and try again.",
        );
        setLoading(false);
        next.terminate();
        worker.current = null;
      };

      next.postMessage(file);
    },
    [archive],
  );

  const example = () => {
    loadId.current++;
    worker.current?.terminate();
    worker.current = null;
    setLoading(false);
    setError("");
    setArchive(null);
    setDataset(createExample());
  };

  const clear = () => {
    loadId.current++;
    worker.current?.terminate();
    worker.current = null;
    setLoading(false);
    setError("");
    setArchive(null);
    setDataset(null);
  };

  return {
    dataset,
    archive,
    revision,
    loading,
    error,
    load,
    example,
    clear,
    dismissError: () => setError(""),
  };
}
