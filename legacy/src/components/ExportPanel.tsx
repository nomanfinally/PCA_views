import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Dataset, Sample } from "../domain/types";
import type { ViewState } from "../domain/viewState";
import {
  imageLegend,
  type ImageOptions,
  type ImagePlacement,
} from "../domain/imageExport";
import { downloadArchive, serializeArchive } from "../domain/archive";
import type { PlotHandle } from "./PcaPlot";
import { downloadText, samplesToCsv } from "../domain/export";
import { composePng, type ChartImage } from "./composePng";
import { Dialog } from "./Dialog";
export function ExportPanel({
  dataset,
  samples,
  state,
  plot,
  onClose,
  options,
  onOptions,
}: {
  dataset: Dataset;
  samples: Sample[];
  state: ViewState;
  plot: RefObject<PlotHandle | null>;
  onClose: () => void;
  options: ImageOptions;
  onOptions: (value: ImageOptions) => void;
}) {
  const [chart, setChart] = useState<ChartImage | null>(null),
    [preview, setPreview] = useState("");
  const [placement, setPlacement] = useState<ImagePlacement | null>(null);
  const [busy, setBusy] = useState(true),
    [htmlBusy, setHtmlBusy] = useState(false),
    [error, setError] = useState("");
  const capture = useRef<Promise<ChartImage> | null>(null);
  const legend = useMemo(
    () => imageLegend(dataset, samples, state),
    [dataset, samples, state],
  );
  const patch = (change: Partial<ImageOptions>) => {
    setBusy(true);
    onOptions({ ...options, ...change });
  };
  useEffect(() => {
    let active = true;
    capture.current ??= plot.current!.capturePng();
    void capture.current
      .then((result) => {
        if (active) setChart(result);
      })
      .catch((e) => {
        if (active) {
          setError(String(e.message ?? e));
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [plot]);
  useEffect(() => {
    if (!chart) return;
    let active = true;
    setBusy(true);
    setError("");
    const timer = setTimeout(() => {
      void composePng(chart, legend, options)
        .then((result) => {
          if (active) {
            setPreview(result.url);
            setPlacement(result.placement);
            setBusy(false);
          }
        })
        .catch((e) => {
          if (active) {
            setError(String(e.message ?? e));
            setBusy(false);
          }
        });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [chart, legend, options]);
  const number = (
    label: string,
    key: keyof ImageOptions,
    min: number,
    max: number,
  ) => (
    <label className="control-row">
      {label}
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={Number(options[key])}
        onChange={(e) => {
          if (e.target.value !== "")
            patch({
              [key]: Math.max(
                min,
                Math.min(max, Math.round(Number(e.target.value))),
              ),
            });
        }}
      />
    </label>
  );
  const weight = (label: string, key: keyof ImageOptions) => (
    <label className="control-row">
      {label}
      <select
        aria-label={label}
        value={String(options[key])}
        onChange={(e) => patch({ [key]: Number(e.target.value) })}
      >
        {[400, 500, 600, 700, 800].map((w) => (
          <option key={w} value={w}>
            {w === 400 ? "Normal" : w === 700 ? "Bold" : w}
          </option>
        ))}
      </select>
    </label>
  );
  const html = async () => {
    setHtmlBusy(true);
    setError("");
    try {
      await downloadArchive(
        serializeArchive(
          dataset,
          state,
          await plot.current!.snapshot(),
          options,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "HTML export failed.");
    } finally {
      setHtmlBusy(false);
    }
  };
  return (
    <Dialog title="Export" onClose={onClose}>
      <div className="export-layout">
        <div className="export-controls">
          <section>
            <h3>Heading</h3>
            <label className="stacked-control">
              Title
              <input
                aria-label="Export title"
                value={options.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            {number("Title font size", "titleSize", 8, 64)}
            {weight("Title font weight", "titleWeight")}
            <label className="stacked-control">
              Subtitle
              <input
                aria-label="Export subtitle"
                value={options.subtitle}
                onChange={(e) => patch({ subtitle: e.target.value })}
              />
            </label>
            {number("Subtitle font size", "subtitleSize", 8, 48)}
            {weight("Subtitle font weight", "subtitleWeight")}
          </section>
          <section>
            <h3>Legend</h3>
            <label className="control-row">
              Include population legend
              <input
                type="checkbox"
                checked={options.includeLegend}
                onChange={(e) => patch({ includeLegend: e.target.checked })}
              />
            </label>
            <label className="control-row">
              Position
              <select
                aria-label="Export legend position"
                value={options.legendPosition}
                onChange={(e) =>
                  patch({
                    legendPosition: e.target
                      .value as ImageOptions["legendPosition"],
                  })
                }
              >
                {["right", "left", "top", "bottom"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            {number("Export legend columns", "legendColumns", 1, 6)}
            {number("Legend font size", "legendFontSize", 8, 32)}
            {weight("Legend font weight", "legendFontWeight")}
            {number("Legend row spacing", "legendRowGap", 0, 32)}
            {number("Legend column spacing", "legendColumnGap", 0, 64)}
            <label className="control-row">
              Legend box boundary
              <input
                type="checkbox"
                checked={options.legendBorder}
                onChange={(e) => patch({ legendBorder: e.target.checked })}
              />
            </label>
          </section>
          <p className="field-note">
            The chart is captured once at the current zoom and proportions.
            Headings and legend occupy additional space outside it.
          </p>
        </div>
        <div className="export-preview" aria-busy={busy}>
          {preview && (
            <img
              src={preview}
              alt="PNG export preview"
              data-plot-box={JSON.stringify(placement?.plotBox)}
              data-legend-box={JSON.stringify(placement?.legend)}
              data-chart-x={placement?.chart.x}
              data-chart-y={placement?.chart.y}
              data-chart-width={chart?.width}
              data-chart-height={chart?.height}
            />
          )}
          {busy && (
            <div className="export-progress" role="status">
              Updating preview…
            </div>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
      <footer className="export-footer">
        <div className="export-archive">
          <button
            className="button"
            disabled={htmlBusy}
            onClick={() => void html()}
          >
            {htmlBusy ? "Preparing HTML…" : "Download interactive HTML"}
          </button>
          <span>
            One offline file · all loaded data, styles, zoom and tools
          </span>
        </div>
        <button
          className="button"
          onClick={() => {
            downloadText(
              samplesToCsv(samples, dataset.pcCount),
              `${dataset.name.replace(/\.evec$/i, "")}_filtered.csv`,
            );
            onClose();
          }}
        >
          Filtered samples · CSV
        </button>
        <button
          className="button primary-export"
          disabled={busy || !preview || !!error}
          onClick={() => {
            const a = document.createElement("a");
            a.href = preview;
            a.download = `${dataset.name.replace(/\.evec$/i, "")}_PC${state.x + 1}_PC${state.y + 1}.png`;
            a.click();
            onClose();
          }}
        >
          Download PNG
        </button>
      </footer>
    </Dialog>
  );
}
