import { embeddedArchive } from "../domain/archive";
import { parseEvec } from "../domain/parseEvec";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset } from "../domain/types";
import { createExample } from "../domain/example";
export function useDataset() {
  const [dataset, setDataset] = useState<Dataset | null>(
    embeddedArchive?.dataset ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const loadId = useRef(0);
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const load = useCallback((file: File) => {
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
    if (embeddedArchive) {
      void file
        .text()
        .then((text) => {
          if (id !== loadId.current) return;
          setDataset(parseEvec(text, file.name));
          setRevision((value) => value + 1);
          setLoading(false);
        })
        .catch((error) => {
          if (id === loadId.current) {
            setError(
              error instanceof Error ? error.message : "Unable to read file.",
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
        setRevision((value) => value + 1);
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
  }, []);
  const example = () => {
    loadId.current++;
    worker.current?.terminate();
    worker.current = null;
    setLoading(false);
    setError("");
    setDataset(createExample());
  };
  const clear = () => {
    loadId.current++;
    worker.current?.terminate();
    worker.current = null;
    setLoading(false);
    setError("");
    setDataset(null);
  };
  return {
    dataset,
    revision,
    loading,
    error,
    load,
    example,
    clear,
    dismissError: () => setError(""),
  };
}
