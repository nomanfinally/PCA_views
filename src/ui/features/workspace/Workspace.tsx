import { Download, PanelRight, Settings2, Table2, X } from "lucide-react";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Dataset } from "../../../core/models/dataset";
import {
  restoreArchiveState,
  type Archive,
} from "../../../services/export/archiveService";
import {
  defaultImageOptions,
  type ImageOptions,
} from "../../../services/export/canvasComposer";
import { downloadText, samplesToCsv } from "../../../services/export/csvExport";
import { viewReducer } from "../../../state/viewReducer";
import { getEffectiveDataset } from "../../../state/viewSelectors";
import { initialView } from "../../../state/viewState";
import { useResponsive } from "../../hooks/useResponsive";
import { useVisibleSamples } from "../../hooks/useVisibleSamples";
import type { Anchor } from "../../primitives/Popover";
import { ExportDialog } from "../export/ExportDialog";
import { LegendDock } from "../populations/LegendDock";
import { PointInspector } from "../samples/PointInspector";
import { SampleTableDialog } from "../samples/SampleTableDialog";
import { SettingsDialog, type SettingsTab } from "../settings/SettingsDialog";
import { AppHeader } from "./AppHeader";
import { AxisControls } from "./AxisControls";
import { HelpModal } from "./HelpModal";
import { PcaPlotCanvas, type PlotHandle } from "./PcaPlotCanvas";
import { PlotToolbar } from "./PlotToolbar";

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
}: WorkspaceProps) {
  const archive = propArchive;

  const [state, dispatch] = useReducer(viewReducer, undefined, () => {
    if (archive) {
      return restoreArchiveState(archive);
    }
    return {
      ...initialView(dataset),
      legend: typeof window !== "undefined" ? window.innerWidth > 640 : true,
    };
  });

  const { isMobile, isTablet, isCompact } = useResponsive();

  // Dialog and inspector ephemeral state
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTab>("Chart");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocusTitle, setSettingsFocusTitle] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [imageOptions, setImageOptions] = useState<ImageOptions | null>(
    () => archive?.imageOptions ?? null,
  );

  const [tableOpen, setTableOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [maximizedPlot, setMaximizedPlot] = useState(false);
  const [pointAnchor, setPointAnchor] = useState<Anchor | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [plotRevision, setPlotRevision] = useState(0);

  const plotRef = useRef<PlotHandle | null>(null);

  // Effective dataset reflecting custom per-sample group IDs
  const effectiveDataset = useMemo(
    () => getEffectiveDataset(dataset, state.samplePopulations),
    [dataset, state.samplePopulations],
  );

  // Derived filtered samples
  const activeSamples = useVisibleSamples(effectiveDataset, state);

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
    const selectedSamples = effectiveDataset.samples.filter((s) =>
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
          dataset={effectiveDataset}
          onUpload={onUpload}
          onHelp={() => setHelpOpen(true)}
          onClear={onClear}
          actions={
            <>
              <button
                className="button"
                aria-label="Sample table"
                onClick={() => setTableOpen(true)}
              >
                <Table2 size={16} />
                <span>Samples</span>
              </button>
              <button
                className="button"
                aria-label="Plot settings"
                onClick={() => handleOpenSettings()}
              >
                <Settings2 size={16} />
                <span>Settings</span>
              </button>
              <button
                className="button primary-export"
                aria-label="Export"
                onClick={() => setExportOpen(true)}
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </>
          }
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

      <AxisControls
        dataset={effectiveDataset}
        state={state}
        dispatch={dispatch}
        isMobile={isMobile}
        isCompact={isCompact}
        maximizedPlot={maximizedPlot}
        onToggleMaximize={() => setMaximizedPlot(!maximizedPlot)}
      />
      <PlotToolbar
        dataset={effectiveDataset}
        state={state}
        dispatch={dispatch}
        plotRef={plotRef}
        onExport={() => setExportOpen(true)}
        onTable={() => setTableOpen(true)}
        fullscreen={fullscreen}
        onFullscreen={toggleFullscreen}
        onSettings={handleOpenSettings}
      />

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
              key={plotRevision}
              ref={plotRef}
              initialViewport={
                plotRevision === 0 ? archive?.viewport : undefined
              }
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

          {isCompact && !state.legend && (
            <button
              className="mobile-legend-pill"
              aria-label="Show legend"
              title="Show legend dock"
              onClick={() => dispatch({ type: "legend" })}
            >
              <PanelRight size={14} />
              <span>Legend ({effectiveDataset.populations.length})</span>
            </button>
          )}
        </main>

        {state.legend && (
          <LegendDock
            compact={isCompact}
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
            {state.excludedSamples.size > 0 && (
              <span className="status-excluded">
                {state.excludedSamples.size} excluded
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
          originalDataset={dataset}
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
            // Remount to discard offsets and the old PC pair/archived viewport.
            setPlotRevision((revision) => revision + 1);
            setSettingsOpen(false);
          }}
        />
      )}

      {/* 8. Export Dialog */}
      {exportOpen && (
        <ExportDialog
          dataset={effectiveDataset}
          originalDataset={dataset}
          samples={activeSamples}
          state={state}
          plotRef={plotRef}
          onClose={() => setExportOpen(false)}
          options={imageOptions ?? defaultImageOptions(state.settings)}
          onOptions={(opts) => setImageOptions(opts)}
        />
      )}

      {/* 9. Sample Table Dialog */}
      {tableOpen && (
        <SampleTableDialog
          dataset={effectiveDataset}
          originalDataset={dataset}
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
