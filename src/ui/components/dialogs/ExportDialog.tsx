import React, { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Download, FileSpreadsheet, Globe, Loader2 } from "lucide-react";
import type { Dataset, Sample } from "../../../core/models/dataset";
import type { ViewState } from "../../../state/viewState";
import {
  composePng,
  imageLegend,
  type ChartImage,
  type ImageOptions,
  type ImagePlacement,
} from "../../../services/export/canvasComposer";
import { downloadBlob, downloadText, samplesToCsv } from "../../../services/export/csvExport";
import { downloadArchive, serializeArchive } from "../../../services/export/archiveService";
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
  const [activeTab, setActiveTab] = useState<"image" | "csv" | "archive">("image");
  const [chart, setChart] = useState<ChartImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
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

    const timer = setTimeout(() => {
      void composePng(chart, legend, options)
        .then((blob) => {
          if (isMounted) {
            const url = URL.createObjectURL(blob);
            setPreviewUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return url;
            });
            setComposedBlob(blob);
            setIsComposing(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(String(err.message ?? err));
            setIsComposing(false);
          }
        });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart, legend, options]);

  const handleDownloadPng = () => {
    if (!composedBlob) return;
    const baseName = dataset.name.replace(/\.[^/.]+$/, "");
    downloadBlob(composedBlob, `${baseName}-pc${state.x + 1}-pc${state.y + 1}.png`);
  };

  const handleDownloadCsv = () => {
    const csvContent = samplesToCsv(samples, dataset.pcCount);
    const baseName = dataset.name.replace(/\.[^/.]+$/, "");
    downloadText(csvContent, `${baseName}-samples.csv`, "text/csv;charset=utf-8");
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

  return (
    <Modal
      isOpen={true}
      title="Export Visualization & Data"
      onClose={onClose}
      className="export-modal"
      width={780}
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
            <div className="image-preview-panel">
              {isComposing ? (
                <div className="preview-loading">
                  <Loader2 size={24} className="spin" />
                  <span>Composing publication-ready image…</span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="preview-image"
                />
              ) : null}
            </div>

            <div className="image-options-panel">
              <label className="control-row">
                Resolution scale
                <select
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

              <label className="control-row">
                Legend placement
                <select
                  value={options.includeLegend ? options.legendPosition : "none"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "none") {
                      patchOptions({ includeLegend: false });
                    } else {
                      patchOptions({
                        includeLegend: true,
                        legendPosition: val as any,
                      });
                    }
                  }}
                >
                  <option value="right">Right of chart</option>
                  <option value="bottom">Below chart</option>
                  <option value="left">Left of chart</option>
                  <option value="top">Above chart</option>
                  <option value="none">No legend</option>
                </select>
              </label>

              <label className="control-row">
                Export title
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => patchOptions({ title: e.target.value })}
                  placeholder="Defaults to dataset name"
                />
              </label>

              <label className="control-row">
                Export subtitle
                <input
                  type="text"
                  value={options.subtitle}
                  onChange={(e) => patchOptions({ subtitle: e.target.value })}
                  placeholder="Defaults to axis summary"
                />
              </label>

              <button
                className="btn-primary primary-export"
                disabled={isComposing || !composedBlob}
                onClick={handleDownloadPng}
              >
                <Download size={14} /> Download PNG
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: CSV Data Export */}
        {activeTab === "csv" && (
          <div className="export-tab-content csv-export">
            <p>
              Download filtered sample rows ({samples.length.toLocaleString()}{" "}
              samples) including their Sample ID, Population, and principal
              component coordinates in RFC 4180 compliant CSV format.
            </p>
            <p className="field-note">
              Formula injection protection is automatically applied to prevent
              spreadsheet macro execution when opened in Excel or Google Sheets.
            </p>

            <button className="btn-primary" onClick={handleDownloadCsv}>
              <Download size={14} /> Download CSV ({samples.length} rows)
            </button>
          </div>
        )}

        {/* Tab 3: Interactive Archive Export */}
        {activeTab === "archive" && (
          <div className="export-tab-content archive-export">
            <p>
              Package the entire current session — including the raw dataset,
              per-population styles, individual point overrides, active axes, and
              viewport zoom level — into a standalone HTML file.
            </p>
            <p className="field-note">
              Recipients can open the file offline in any modern web browser to
              interactively pan, zoom, inspect samples, and adjust settings with
              zero server dependencies.
            </p>

            <button
              className="btn-primary"
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

      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
