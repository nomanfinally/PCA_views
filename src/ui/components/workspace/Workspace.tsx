import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  PanelRight,
  Search,
  X,
} from "lucide-react";
import type { Dataset, Sample } from "../../../core/models/dataset";
import { initialView, type ViewState } from "../../../state/viewState";
import { viewReducer } from "../../../state/viewReducer";
import {
  filteredSamples,
  getEffectiveDataset,
  selectAxisVariance,
} from "../../../state/viewSelectors";
import {
  readEmbeddedArchive,
  restoreArchiveState,
  type Archive,
} from "../../../services/export/archiveService";
import {
  defaultImageOptions,
  type ImageOptions,
} from "../../../services/export/canvasComposer";
import { downloadText, samplesToCsv } from "../../../services/export/csvExport";
import { useResponsive } from "../../hooks/useResponsive";
import type { Anchor } from "../../primitives/Popover";
import { AppHeader } from "../header/AppHeader";
import { PlotToolbar } from "../toolbar/PlotToolbar";
import { PcaPlotCanvas, type PlotHandle } from "../plot/PcaPlotCanvas";
import { LegendDock } from "../legend/LegendDock";
import { PointInspector } from "../inspectors/PointInspector";
import { SettingsDialog, type SettingsTab } from "../dialogs/SettingsDialog";
import { ExportDialog } from "../dialogs/ExportDialog";
import { SampleTableDialog } from "../dialogs/SampleTableDialog";
import { HelpModal } from "../dialogs/HelpModal";

export interface WorkspaceProps {
  dataset: Dataset;
  archive?: Archive | null;
  onUpload: () => void;
  onClear: () => void;
  onHelp: () => void;
}

export function Workspace({
  dataset,
  archive: propArchive,
  onUpload,
  onClear,
  onHelp,
}: WorkspaceProps) {
  const archive = propArchive ?? readEmbeddedArchive();

  const [state, dispatch] = useReducer(viewReducer, undefined, () => {
    if (archive) {
      return restoreArchiveState(archive);
    }
    return {
      ...initialView(dataset),
      legend: typeof window !== "undefined" ? window.innerWidth >= 640 : true,
    };
  });

  const { isMobile, isTablet, isCompact } = useResponsive();

  // Dialog and inspector ephemeral state
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTab>("Chart");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocusTitle, setSettingsFocusTitle] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [imageOptions, setImageOptions] = useState<ImageOptions>(
    () => archive?.imageOptions ?? defaultImageOptions(state.settings),
  );

  const [tableOpen, setTableOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [maximizedPlot, setMaximizedPlot] = useState(false);
  const [pointAnchor, setPointAnchor] = useState<Anchor | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const plotRef = useRef<PlotHandle | null>(null);

  // Effective dataset reflecting custom per-sample group IDs
  const effectiveDataset = useMemo(
    () => getEffectiveDataset(dataset, state.samplePopulations),
    [dataset, state.samplePopulations],
  );

  // Derived filtered samples
  const activeSamples = useMemo(
    () => filteredSamples(effectiveDataset, state),
    [effectiveDataset, state],
  );

  // Population color map
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const pop of effectiveDataset.populations) {
      const custom = state.populations.get(pop.name);
      map.set(pop.name, custom?.color ?? pop.color);
    }
    return map;
  }, [effectiveDataset.populations, state.populations]);

  // Status counts
  const markedCount = useMemo(() => {
    let count = 0;
    for (const p of state.points.values()) {
      if (p.marked) count++;
    }
    return count;
  }, [state.points]);

  const hiddenCount = useMemo(() => {
    let count = 0;
    for (const p of state.populations.values()) {
      if (p.hidden) count++;
    }
    return count;
  }, [state.populations]);

  // Fullscreen sync
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleOpenSettings = (tab?: string, focusTitle = false) => {
    if (tab) {
      setActiveSettingsTab(tab as SettingsTab);
    }
    setSettingsFocusTitle(focusTitle);
    setSettingsOpen(true);
  };

  const handleExportSelection = () => {
    const selectedSamples = dataset.samples.filter((s) =>
      state.selected.has(s.key),
    );
    const csv = samplesToCsv(selectedSamples, dataset.pcCount);
    const baseName = dataset.name.replace(/\.[^/.]+$/, "");
    downloadText(
      csv,
      `${baseName}-selected-samples.csv`,
      "text/csv;charset=utf-8",
    );
  };

  return (
    <div
      className={`workspace-root ${maximizedPlot ? "maximized-plot" : ""}`}
      data-legend-position={state.settings.legendPosition}
    >
      {/* 1. Header */}
      {!maximizedPlot && (
        <AppHeader
          dataset={dataset}
          onUpload={onUpload}
          onHelp={() => setHelpOpen(true)}
          onClear={onClear}
          axes={[state.x, state.y]}
          state={state}
        />
      )}

      {/* 3. Floating Selection Pill */}
      {state.selected.size > 0 && (
        <div
          className="selection-bar"
          role="toolbar"
          aria-label="Selection actions"
        >
          <strong>{state.selected.size} selected</strong>
          <button
            onClick={() => dispatch({ type: "markSelection", marked: true })}
          >
            Mark selected
          </button>
          <button
            onClick={() => dispatch({ type: "markSelection", marked: false })}
          >
            Unmark selected
          </button>
          <button onClick={handleExportSelection}>Export selection</button>
          <button
            className="icon-button"
            aria-label="Clear selection"
            title="Clear selection"
            onClick={() => dispatch({ type: "select", keys: [] })}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. Integrated Single-Row Toolbar */}
      <div className="workspace-toolbar">
        <PlotToolbar
          dataset={effectiveDataset}
          activeSamplesCount={activeSamples.length}
          totalSamplesCount={effectiveDataset.samples.length}
          excludedCount={state.excludedSamples.size}
          state={state}
          dispatch={dispatch}
          plotRef={plotRef}
          onExport={() => setExportOpen(true)}
          onTable={() => setTableOpen(true)}
          fullscreen={fullscreen}
          onFullscreen={toggleFullscreen}
          onSettings={handleOpenSettings}
        />

        <div className="axis-toolbar-divider" aria-hidden="true" />

        <div className="axis-pickers">
          <label className="axis-select-label">
            <span className="axis-badge">X</span>
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
              {Array.from({ length: dataset.pcCount }, (_, i) => {
                const variance = selectAxisVariance(dataset, state, i);
                return (
                  <option key={i} value={i} disabled={i === state.y}>
                    PC{i + 1}
                    {variance != null ? ` (${variance.toFixed(1)}%)` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            className="icon-button swap-axes-btn"
            aria-label="Swap axes"
            title="Swap horizontal and vertical axes"
            onClick={() =>
              dispatch({ type: "axes", x: state.y, y: state.x })
            }
          >
            <ArrowLeftRight size={14} />
          </button>

          <label className="axis-select-label">
            <span className="axis-badge">Y</span>
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
              {Array.from({ length: dataset.pcCount }, (_, i) => {
                const variance = selectAxisVariance(dataset, state, i);
                return (
                  <option key={i} value={i} disabled={i === state.x}>
                    PC{i + 1}
                    {variance != null ? ` (${variance.toFixed(1)}%)` : ""}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <div className="search-tools">
          <div className="sample-search search-field">
            <Search size={13} aria-hidden="true" />
            <input
              aria-label="Search samples"
              placeholder={
                isMobile ? "Search…" : "Find sample or population…"
              }
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
            title="Toggle legend dock"
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

      {/* 5. Main Plot & Legend Area */}
      <div className={`plot-workspace ${state.legend ? "with-legend" : ""}`}>
        <main className="chart-surface">
          <div
            className={`plot-container ${state.settings.aspectRatio !== "full" ? "has-ratio" : ""} ${state.settings.aspectRatio === "1:1" ? "is-square" : ""}`}
            style={
              {
                "--plot-ratio":
                  state.settings.aspectRatio === "full"
                    ? 1
                    : Number(state.settings.aspectRatio.split(":")[0]) /
                      Number(state.settings.aspectRatio.split(":")[1]),
              } as React.CSSProperties
            }
          >
            <PcaPlotCanvas
              ref={plotRef}
              initialViewport={archive?.viewport}
              dataset={effectiveDataset}
              samples={activeSamples}
              state={state}
              onMark={(key) => dispatch({ type: "toggleMark", key })}
              onEdit={(key, anchor) => {
                setPointAnchor(anchor);
                dispatch({ type: "inspect", key });
              }}
              onSelect={(keys) => dispatch({ type: "select", keys })}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </div>
        </main>

        {state.legend && (
          <LegendDock
            dataset={effectiveDataset}
            state={state}
            dispatch={dispatch}
            onSettings={() => handleOpenSettings("Legend")}
          />
        )}
      </div>

      {/* 5. Status Bar */}
      {!maximizedPlot && (
        <footer className="statusbar" role="contentinfo">
          <div>
            <span className="status-dot" />
            <span>
              {activeSamples.length.toLocaleString()} /{" "}
              {dataset.samples.length.toLocaleString()} samples visible
            </span>
            {hiddenCount > 0 && (
              <span className="status-hidden">
                {hiddenCount} populations hidden
              </span>
            )}
            {markedCount > 0 && (
              <button
                className="text-button"
                onClick={() => dispatch({ type: "clearMarks" })}
                title="Click to clear all marked sample borders"
              >
                {markedCount} marked · clear
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
      )}

      {/* 6. Point Inspector Popover */}
      {state.inspector !== null && (
        <PointInspector
          dataset={effectiveDataset}
          state={state}
          dispatch={dispatch}
          anchor={pointAnchor}
          onClose={() => {
            setPointAnchor(null);
            dispatch({ type: "inspect", key: null });
          }}
        />
      )}

      {/* 7. Settings Dialog (Tab resumable!) */}
      {settingsOpen && (
        <SettingsDialog
          dataset={effectiveDataset}
          state={state}
          dispatch={dispatch}
          initialTab={activeSettingsTab}
          focusTitle={settingsFocusTitle}
          onTabChange={(tab) => setActiveSettingsTab(tab)}
          onClose={(lastTab) => {
            if (lastTab) setActiveSettingsTab(lastTab);
            setSettingsOpen(false);
          }}
          onReset={() => {
            dispatch({ type: "resetView", dataset });
            plotRef.current?.reset();
            setSettingsOpen(false);
          }}
        />
      )}

      {/* 8. Export Dialog */}
      {exportOpen && (
        <ExportDialog
          dataset={effectiveDataset}
          samples={activeSamples}
          state={state}
          plotRef={plotRef}
          onClose={() => setExportOpen(false)}
          options={imageOptions}
          onOptions={(opts) => setImageOptions(opts)}
        />
      )}

      {/* 9. Sample Table Dialog */}
      {tableOpen && (
        <SampleTableDialog
          dataset={effectiveDataset}
          allSamples={effectiveDataset.samples}
          samples={activeSamples}
          x={state.x}
          y={state.y}
          selected={
            state.inspector !== null
              ? effectiveDataset.samples[state.inspector]
              : null
          }
          onSelect={(sample) => {
            dispatch({ type: "inspect", key: sample.key, mark: true });
            setTableOpen(false);
          }}
          colors={colors}
          state={state}
          dispatch={dispatch}
          onClose={() => setTableOpen(false)}
        />
      )}

      {/* 10. Help Modal */}
      {helpOpen && (
        <HelpModal isOpen={true} onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}
