import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Download,
  FileSpreadsheet,
  Globe,
  Loader2,
} from "lucide-react";
import type { Dataset, Sample } from "../../../core/models/dataset";
import type { ViewState } from "../../../state/viewState";
import {
  composePng,
  imageLegend,
  type ChartImage,
  type ImageOptions,
  type ImagePlacement,
} from "../../../services/export/canvasComposer";
import {
  downloadBlob,
  downloadText,
  samplesToCsv,
  samplesToEvec,
} from "../../../services/export/csvExport";
import {
  downloadArchive,
  serializeArchive,
} from "../../../services/export/archiveService";
import { Modal } from "../../primitives/Modal";
import type { PlotHandle } from "../plot/PcaPlotCanvas";

export interface ExportDialogProps {
  dataset: Dataset;
  samples: Sample[];
  state: ViewState;
  plotRef: React.RefObject<PlotHandle | null>;
  onClose: () => void;
  options: ImageOptions;
  onOptions: (options: ImageOptions) => void;
}

export function ExportDialog({
  dataset,
  samples,
  state,
  plotRef,
  onClose,
  options,
  onOptions,
}: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"image" | "csv" | "archive">(
    "image",
  );
  const [chart, setChart] = useState<ChartImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
  const [placement, setPlacement] = useState<ImagePlacement | null>(null);
  const [isComposing, setIsComposing] = useState(true);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capturePromise = useRef<Promise<ChartImage> | null>(null);

  const legend = useMemo(
    () => imageLegend(dataset, samples, state),
    [dataset, samples, state],
  );

  const patchOptions = (patch: Partial<ImageOptions>) => {
    setIsComposing(true);
    onOptions({ ...options, ...patch });
  };

  // Capture raster plot image
  useEffect(() => {
    let isMounted = true;
    if (!plotRef.current) return;

    capturePromise.current ??= plotRef.current.capturePng();
    void capturePromise.current
      .then((img) => {
        if (isMounted) setChart(img);
      })
      .catch((err) => {
        if (isMounted) {
          setError(String(err.message ?? err));
          setIsComposing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [plotRef]);

  // Compose high-resolution image with legend and headers
  useEffect(() => {
    if (!chart) return;
    let isMounted = true;
    setIsComposing(true);
    setError(null);

    const delay = 100;
    const timer = setTimeout(() => {
      void composePng(chart, legend, options)
        .then((result) => {
          if (isMounted) {
            const url = URL.createObjectURL(result.blob);
            setPreviewUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return url;
            });
            setComposedBlob(result.blob);
            setPlacement(result.placement);
            setIsComposing(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(String(err.message ?? err));
            setIsComposing(false);
          }
        });
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart, legend, options]);

  const handleDownloadPng = () => {
    if (!composedBlob) return;
    const baseName = dataset.name.replace(/\.evec$/i, "");
    downloadBlob(
      composedBlob,
      `${baseName}_PC${state.x + 1}_PC${state.y + 1}.png`,
    );
    onClose();
  };

  const handleDownloadCsv = () => {
    const csvContent = samplesToCsv(dataset.samples, dataset.pcCount, {
      excludedKeys: state.excludedSamples,
      samplePopulations: state.samplePopulations,
    });
    const baseName = dataset.name.replace(/\.evec$/i, "");
    downloadText(
      csvContent,
      `${baseName}_filtered.csv`,
      "text/csv;charset=utf-8",
    );
    onClose();
  };

  const handleDownloadEvec = () => {
    const evecContent = samplesToEvec(dataset.samples, dataset.eigenvalues, {
      excludedKeys: state.excludedSamples,
      samplePopulations: state.samplePopulations,
    });
    const baseName = dataset.name.replace(/\.evec$/i, "");
    downloadText(
      evecContent,
      `${baseName}_export.evec`,
      "text/plain;charset=utf-8",
    );
    onClose();
  };

  const handleDownloadArchive = async () => {
    setArchiveBusy(true);
    try {
      const viewport = (await plotRef.current?.snapshot()) ?? {
        xRange: [-1, 1],
        yRange: [-1, 1],
        offsets: [],
        width: 800,
        height: 600,
      };
      const archive = serializeArchive(dataset, state, viewport, options);
      await downloadArchive(archive);
    } catch (err: any) {
      setError(err.message ?? "Failed to compile HTML archive.");
    } finally {
      setArchiveBusy(false);
    }
  };

  type NumberOptionKey = {
    [K in keyof ImageOptions]: NonNullable<ImageOptions[K]> extends number
      ? K
      : never;
  }[keyof ImageOptions] &
    keyof ImageOptions;

  const number = (
    label: string,
    key: NumberOptionKey,
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
        value={options[key] ?? ""}
        onChange={(e) => {
          if (e.target.value !== "") {
            const num = Number(e.target.value);
            if (!isNaN(num)) {
              patchOptions({
                [key]: Math.max(min, Math.min(max, Math.round(num))),
              });
            }
          }
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
        onChange={(e) => patchOptions({ [key]: Number(e.target.value) })}
      >
        {[400, 500, 600, 700, 800].map((w) => (
          <option key={w} value={w}>
            {w === 400 ? "Normal" : w === 700 ? "Bold" : w}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal
      isOpen={true}
      title="Export Visualization & Data"
      onClose={onClose}
      className="export-modal"
      width={1000}
      maxWidth="min(96vw, 1050px)"
      noPadding={true}
    >
      <div className="export-container">
        {/* Navigation Tabs */}
        <div className="export-tabs" role="tablist">
          <button
            className={`export-tab-btn ${activeTab === "image" ? "active" : ""}`}
            onClick={() => setActiveTab("image")}
          >
            <Camera size={14} /> PNG Image
          </button>
          <button
            className={`export-tab-btn ${activeTab === "csv" ? "active" : ""}`}
            onClick={() => setActiveTab("csv")}
          >
            <FileSpreadsheet size={14} /> CSV Coordinates
          </button>
          <button
            className={`export-tab-btn ${activeTab === "archive" ? "active" : ""}`}
            onClick={() => setActiveTab("archive")}
          >
            <Globe size={14} /> Interactive Archive
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: PNG Image Export */}
        {activeTab === "image" && (
          <div className="export-tab-content image-export">
            <div
              className="image-preview-panel export-preview"
              aria-busy={isComposing}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="PNG export preview"
                  className="preview-image"
                  data-plot-box={JSON.stringify(placement?.plotBox)}
                  data-legend-box={JSON.stringify(placement?.legend)}
                  data-chart-x={placement?.chart.x}
                  data-chart-y={placement?.chart.y}
                  data-chart-width={chart?.width}
                  data-chart-height={chart?.height}
                />
              ) : isComposing ? (
                <div className="preview-loading">
                  <Loader2 size={24} className="spin" />
                  <span>Composing publication-ready image…</span>
                </div>
              ) : null}
              {previewUrl && isComposing && (
                <div className="export-progress" role="status">
                  <Loader2 size={13} className="spin" />
                  <span>Updating preview…</span>
                </div>
              )}
            </div>

            <div className="image-options-panel export-controls">
              <section>
                <h3>Heading</h3>
                <label className="stacked-control">
                  Title
                  <input
                    aria-label="Export title"
                    value={options.title}
                    onChange={(e) => patchOptions({ title: e.target.value })}
                  />
                </label>
                {number("Title font size", "titleSize", 8, 64)}
                {weight("Title font weight", "titleWeight")}
                <label className="stacked-control">
                  Subtitle
                  <input
                    aria-label="Export subtitle"
                    value={options.subtitle}
                    onChange={(e) => patchOptions({ subtitle: e.target.value })}
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
                    onChange={(e) =>
                      patchOptions({ includeLegend: e.target.checked })
                    }
                  />
                </label>
                <label className="control-row">
                  Position
                  <select
                    aria-label="Export legend position"
                    value={options.legendPosition}
                    onChange={(e) =>
                      patchOptions({
                        legendPosition: e.target
                          .value as ImageOptions["legendPosition"],
                      })
                    }
                  >
                    {["right", "left", "top", "bottom"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
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
                    onChange={(e) =>
                      patchOptions({ legendBorder: e.target.checked })
                    }
                  />
                </label>
              </section>

              <section>
                <h3>Resolution</h3>
                <label className="control-row">
                  Scale
                  <select
                    aria-label="Export scale"
                    value={options.scale ?? 2}
                    onChange={(e) =>
                      patchOptions({ scale: Number(e.target.value) })
                    }
                  >
                    <option value={1}>1× Screen (72 DPI)</option>
                    <option value={2}>2× High-DPI (144 DPI)</option>
                    <option value={3}>3× Print (300 DPI)</option>
                    <option value={4}>4× Ultra (600 DPI)</option>
                  </select>
                </label>
              </section>
            </div>
          </div>
        )}

        {/* Tab 2: CSV / EVEC Data Export */}
        {activeTab === "csv" && (
          <div className="export-tab-content csv-export">
            <p>
              Download sample rows ({dataset.samples.length.toLocaleString()}{" "}
              samples) including their Sample ID (IID), Population (FID), and
              principal component coordinates in standard CSV or smartPCA .evec
              format.
            </p>
            <p className="field-note">
              Modified group labels are exported. Any unplotted/excluded samples
              are included with "_excluded" appended to their group label (e.g.,
              Han.DG_excluded).
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="button button-dark" onClick={handleDownloadCsv}>
                <Download size={14} /> Download CSV ({dataset.samples.length}{" "}
                rows)
              </button>
              <button className="button" onClick={handleDownloadEvec}>
                <Download size={14} /> Download .evec ({dataset.samples.length}{" "}
                rows)
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Archive Export */}
        {activeTab === "archive" && (
          <div className="export-tab-content archive-export">
            <p>
              Package the entire current session — including the raw dataset,
              per-population styles, individual point overrides, active axes,
              and viewport zoom level — into a standalone HTML file.
            </p>
            <p className="field-note">
              Recipients can open the file offline in any modern web browser to
              interactively pan, zoom, inspect samples, and adjust settings with
              zero server dependencies.
            </p>

            <button
              className="button button-dark"
              disabled={archiveBusy}
              onClick={handleDownloadArchive}
            >
              {archiveBusy ? (
                <>
                  <Loader2 size={14} className="spin" /> Compiling archive…
                </>
              ) : (
                <>
                  <Download size={14} /> Download Standalone HTML Archive
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="modal-footer export-footer">
        <div className="export-archive">
          <button
            className="button"
            disabled={archiveBusy}
            onClick={handleDownloadArchive}
          >
            {archiveBusy ? "Preparing HTML…" : "Download interactive HTML"}
          </button>
          <span>
            One offline file · all loaded data, styles, zoom and tools
          </span>
        </div>
        <button className="button" onClick={handleDownloadCsv}>
          Filtered samples · CSV
        </button>
        <button
          className="button primary-export"
          disabled={!composedBlob || isComposing}
          onClick={handleDownloadPng}
        >
          Download PNG
        </button>
      </div>
    </Modal>
  );
}
