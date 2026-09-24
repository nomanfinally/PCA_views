import { defaultImageOptions, type ImageOptions } from "../domain/imageExport";
import { embeddedArchive, restoreArchiveState } from "../domain/archive";
import { SettingsDialog, type SettingsTab } from "./SettingsDialog";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ArrowLeftRight,
  Search,
  X,
  PanelRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Dataset } from "../domain/types";
import { filteredSamples, initialView, viewReducer } from "../domain/viewState";
import { PcaPlot, type PlotHandle } from "./PcaPlot";
import { Legend } from "./Legend";
import { PointInspector } from "./PointInspector";
import { PlotTools } from "./PlotTools";
import { type Anchor } from "./Popover";
import { SampleTable } from "./SampleTable";
import { downloadText, samplesToCsv } from "../domain/export";
import { AppHeader } from "./AppHeader";
import { useIsMobile, useIsTablet } from "../hooks/useIsMobile";
const ExportPanel = lazy(() =>
  import("./ExportPanel").then((module) => ({ default: module.ExportPanel })),
);
export function Workspace({
  dataset,
  onUpload,
  onClear,
  onHelp,
}: {
  dataset: Dataset;
  onUpload: () => void;
  onClear: () => void;
  onHelp: () => void;
}) {
  const archive = embeddedArchive?.dataset === dataset ? embeddedArchive : null;
  const [state, dispatch] = useReducer(viewReducer, undefined, () =>
    archive
      ? restoreArchiveState(archive)
      : { ...initialView(dataset), legend: window.innerWidth >= 540 },
  );
  const [viewRevision, setViewRevision] = useState(0);
  const [imageOptions, setImageOptions] = useState<ImageOptions | null>(
    archive?.imageOptions ?? null,
  );
  const [settings, setSettings] = useState<{
    tab: SettingsTab;
    focusTitle?: boolean;
  } | null>(null);
  const openSettings = (tab: SettingsTab, focusTitle = false) =>
    setSettings({ tab, focusTitle });
  const isMobile = useIsMobile(640);
  const isTablet = useIsTablet(641, 1024);
  const isCompact = isMobile || isTablet;
  const [maximizedPlot, setMaximizedPlot] = useState(false);
  const [pointAnchor, setPointAnchor] = useState<Anchor | null>(null);
  const [table, setTable] = useState(false),
    [fullscreen, setFullscreen] = useState(false);
  const [exportMenu, setExportMenu] = useState<Anchor | null>(null),
    [error, setError] = useState("");
  const plot = useRef<PlotHandle>(null);
  const samples = useMemo(
    () => filteredSamples(dataset, state),
    [dataset, state.search, state.populations],
  );
  const colors = useMemo(
    () =>
      new Map(
        dataset.populations.map((p) => [
          p.name,
          state.populations.get(p.name)?.color ?? p.color,
        ]),
      ),
    [dataset, state.populations],
  );
  const marked = [...state.points.values()].filter((p) => p.marked).length;
  const hidden = dataset.populations.filter(
    (p) => state.populations.get(p.name)?.hidden,
  ).length;
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = () => {
    if (isCompact) {
      setMaximizedPlot(!maximizedPlot);
      return;
    }
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen()
        .catch(() => setMaximizedPlot(true));
  };
  return (
    <div
      className={`workspace-root ${maximizedPlot && isCompact ? "maximized-plot" : ""} ${isMobile ? "is-mobile" : isTablet ? "is-tablet" : ""}`}
    >
      <AppHeader
        dataset={dataset}
        onUpload={onUpload}
        onHelp={onHelp}
        onClear={onClear}
        axes={[state.x, state.y]}
        state={state}
      />
      <div className="workspace-toolbar">
        <PlotTools
          dataset={dataset}
          state={state}
          dispatch={dispatch}
          plot={plot}
          onExport={setExportMenu}
          onTable={() => setTable(true)}
          fullscreen={fullscreen}
          onFullscreen={toggleFullscreen}
          onSettings={openSettings}
        />
        <div className="axes-bar">
          <label>
            <span>X</span>
            <select
              aria-label="Horizontal axis"
              value={state.x}
              onChange={(e) =>
                dispatch({
                  type: "axes",
                  x: Number(e.target.value),
                  y: state.y,
                })
              }
            >
              {Array.from({ length: dataset.pcCount }, (_, i) => (
                <option key={i} value={i} disabled={i === state.y}>
                  PC{i + 1}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            aria-label="Swap axes"
            title="Swap axes"
            onClick={() => dispatch({ type: "axes", x: state.y, y: state.x })}
          >
            <ArrowLeftRight size={14} />
          </button>
          <label>
            <span>Y</span>
            <select
              aria-label="Vertical axis"
              value={state.y}
              onChange={(e) =>
                dispatch({
                  type: "axes",
                  x: state.x,
                  y: Number(e.target.value),
                })
              }
            >
              {Array.from({ length: dataset.pcCount }, (_, i) => (
                <option key={i} value={i} disabled={i === state.x}>
                  PC{i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="search-tools">
          <div className="sample-search search-field">
            <Search size={13} />
            <input
              aria-label="Search samples"
              placeholder={isMobile ? "Search…" : "Find sample or population…"}
              value={state.search}
              onChange={(e) =>
                dispatch({ type: "search", value: e.target.value })
              }
            />
            {state.search && (
              <button
                className="icon-button"
                aria-label="Clear sample search"
                onClick={() => dispatch({ type: "search", value: "" })}
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            className={`icon-button ${state.legend ? "active" : ""}`}
            aria-label="Toggle legend"
            title="Toggle legend"
            aria-pressed={state.legend}
            onClick={() => dispatch({ type: "legend" })}
          >
            <PanelRight size={17} />
          </button>
          {isCompact && (
            <button
              className={`icon-button mobile-maximize-btn ${maximizedPlot ? "active" : ""}`}
              aria-label={
                maximizedPlot ? "Restore normal view" : "Maximize plot area"
              }
              title={
                maximizedPlot ? "Restore normal view" : "Maximize plot area"
              }
              onClick={() => setMaximizedPlot(!maximizedPlot)}
            >
              {maximizedPlot ? (
                <Minimize2 size={16} />
              ) : (
                <Maximize2 size={16} />
              )}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}
          <button
            className="icon-button"
            aria-label="Dismiss chart error"
            onClick={() => setError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className={`plot-workspace ${state.legend ? "with-legend" : ""}`}>
        <main className="chart-surface">
          <PcaPlot
            ref={plot}
            key={viewRevision}
            initialViewport={viewRevision === 0 ? archive?.viewport : undefined}
            dataset={dataset}
            samples={samples}
            state={state}
            isMobile={isMobile}
            isTablet={isTablet}
            onMark={(key) => dispatch({ type: "toggleMark", key })}
            onEdit={(key, anchor) => {
              setPointAnchor(anchor);
              dispatch({ type: "inspect", key });
            }}
            onSelect={(keys) => dispatch({ type: "select", keys })}
          />
          {isCompact && maximizedPlot && (
            <div
              className="mobile-floating-controls"
              role="toolbar"
              aria-label="Quick plot controls"
            >
              <div className="axes-bar compact-axes">
                <label>
                  <span>X</span>
                  <select
                    aria-label="Horizontal axis"
                    value={state.x}
                    onChange={(e) =>
                      dispatch({
                        type: "axes",
                        x: Number(e.target.value),
                        y: state.y,
                      })
                    }
                  >
                    {Array.from({ length: dataset.pcCount }, (_, i) => (
                      <option key={i} value={i} disabled={i === state.y}>
                        PC{i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="icon-button"
                  aria-label="Swap axes"
                  title="Swap axes"
                  onClick={() =>
                    dispatch({ type: "axes", x: state.y, y: state.x })
                  }
                >
                  <ArrowLeftRight size={13} />
                </button>
                <label>
                  <span>Y</span>
                  <select
                    aria-label="Vertical axis"
                    value={state.y}
                    onChange={(e) =>
                      dispatch({
                        type: "axes",
                        x: state.x,
                        y: Number(e.target.value),
                      })
                    }
                  >
                    {Array.from({ length: dataset.pcCount }, (_, i) => (
                      <option key={i} value={i} disabled={i === state.x}>
                        PC{i + 1}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className={`icon-button ${state.legend ? "active" : ""}`}
                aria-label="Toggle legend"
                title="Toggle legend"
                onClick={() => dispatch({ type: "legend" })}
              >
                <PanelRight size={15} />
              </button>
              <button
                className="icon-button active"
                aria-label="Restore normal view"
                title="Restore normal view"
                onClick={() => setMaximizedPlot(false)}
              >
                <Minimize2 size={15} />
              </button>
            </div>
          )}
          {state.inspector !== null && (
            <PointInspector
              anchor={pointAnchor}
              onClose={() => {
                setPointAnchor(null);
                dispatch({ type: "inspect", key: null });
              }}
              dataset={dataset}
              state={state}
              dispatch={dispatch}
            />
          )}
          {!!state.selected.size && (
            <div className="selection-bar">
              <strong>{state.selected.size} selected</strong>
              <button
                onClick={() =>
                  dispatch({ type: "markSelection", marked: true })
                }
              >
                Mark selected
              </button>
              <button
                onClick={() =>
                  downloadText(
                    samplesToCsv(
                      dataset.samples.filter((s) => state.selected.has(s.key)),
                      dataset.pcCount,
                    ),
                    "selected_samples.csv",
                  )
                }
              >
                Export selection
              </button>
              <button
                className="icon-button"
                aria-label="Clear selection"
                onClick={() => dispatch({ type: "select", keys: [] })}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </main>
        {state.legend && (
          <Legend
            dataset={dataset}
            state={state}
            dispatch={dispatch}
            onSettings={() => openSettings("Legend")}
          />
        )}
      </div>
      <footer className="statusbar">
        <div>
          <span className="status-dot" />
          <span>
            {samples.length.toLocaleString()} /{" "}
            {dataset.samples.length.toLocaleString()} samples visible
          </span>
          {hidden > 0 && (
            <span className="status-hidden">{hidden} populations hidden</span>
          )}
          {marked > 0 && (
            <button
              className="text-button"
              onClick={() => dispatch({ type: "clearMarks" })}
            >
              {marked} marked · clear
            </button>
          )}
        </div>
        <span className="status-hint">
          Wheel to zoom · Drag to{" "}
          {state.mode === "pan"
            ? "pan"
            : state.mode === "zoom"
              ? "zoom"
              : state.mode === "select"
                ? "select"
                : "lasso"}{" "}
          · Click a point to mark
        </span>
        <span className="local-status">Local session</span>
      </footer>
      {settings && (
        <SettingsDialog
          dataset={dataset}
          state={state}
          dispatch={dispatch}
          onReset={() => {
            dispatch({ type: "resetView", dataset });
            setViewRevision((value) => value + 1);
            setImageOptions(null);
            setPointAnchor(null);
            setSettings(null);
          }}
          initialTab={settings.tab}
          focusTitle={settings.focusTitle}
          onClose={() => setSettings(null)}
        />
      )}
      {exportMenu && (
        <Suspense
          fallback={
            <div className="file-notice" role="status">
              Preparing export…
            </div>
          }
        >
          <ExportPanel
            dataset={dataset}
            samples={samples}
            state={state}
            plot={plot}
            options={imageOptions ?? defaultImageOptions(state)}
            onOptions={setImageOptions}
            onClose={() => setExportMenu(null)}
          />
        </Suspense>
      )}
      {table && (
        <div className="modal-backdrop" onClick={() => setTable(false)}>
          <section
            className="table-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Sample table"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setTable(false);
            }}
          >
            <div className="modal-header">
              <h2>
                Samples <span>{samples.length.toLocaleString()}</span>
              </h2>
              <button
                autoFocus
                className="icon-button"
                aria-label="Close sample table"
                onClick={() => setTable(false)}
              >
                <X size={18} />
              </button>
            </div>
            <SampleTable
              samples={samples}
              x={state.x}
              y={state.y}
              colors={colors}
              selected={
                state.inspector === null
                  ? null
                  : dataset.samples[state.inspector]
              }
              onSelect={(sample) => {
                dispatch({ type: "inspect", key: sample.key, mark: true });
                setTable(false);
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}
