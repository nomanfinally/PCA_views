import { useEffect, useRef, useState, type Dispatch } from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw } from "lucide-react";
import type { Dataset } from "../domain/types";
import {
  axisThicknessPresets,
  type ViewState,
  type ViewAction,
  type MarkerPreset,
  type OutlineMode,
  type LabelMode,
  type GroupLabelStyle,
} from "../domain/viewState";
import {
  chartBackgroundPresets,
  paletteNames,
  type PaletteName,
} from "../domain/colors";
import { parseSpectrum } from "../domain/metadata";
import {
  AspectRatioControls,
  LegendLayoutControls,
  Slider,
} from "./StyleControls";

const tabs = [
  "Chart",
  "Markers",
  "Labels",
  "Legend",
  "Hover",
  "Geometry",
  "Variance",
] as const;
export type SettingsTab = (typeof tabs)[number];
export function SettingsDialog({
  dataset,
  state,
  dispatch,
  initialTab,
  focusTitle,
  onClose,
  onReset,
}: {
  dataset: Dataset;
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
  initialTab: SettingsTab;
  focusTitle?: boolean;
  onClose: () => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const names = dataset.populations.map((p) => p.name);
  const s = state.settings;
  const isHollow = s.markerPreset.startsWith("hollow");
  const patch = (value: Partial<typeof s>) =>
    dispatch({ type: "settings", patch: value });
  const hulls = names.some((n) => state.populations.get(n)?.hull);
  const regression = names.some((n) => state.populations.get(n)?.regression);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = dialog.current!;
    const focusables = () =>
      [
        ...root.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ),
      ].filter((e) => e.tabIndex >= 0 && e.getClientRects().length);
    (focusTitle
      ? root.querySelector<HTMLElement>('[aria-label="Plot title"]')
      : root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    )?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key !== "Tab") return;
      const items = focusables(),
        first = items[0],
        last = items.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !root.contains(document.activeElement))
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !root.contains(document.activeElement))
      ) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      if (opener?.isConnected) opener.focus();
    };
  }, [focusTitle]);
  const read = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Metadata files must be smaller than 10 MB.");
      const text = await file.text();
      dispatch({
        type: "spectrum",
        value: parseSpectrum(text, dataset),
        name: file.name,
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read metadata.");
    }
  };
  return createPortal(
    <div
      className="modal-backdrop settings-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Plot settings"
        ref={dialog}
      >
        <header className="modal-header">
          <h2>Plot settings</h2>
          <button
            className="icon-button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="settings-layout">
          <div
            className="settings-tabs"
            role="tablist"
            aria-label="Settings sections"
            aria-orientation="vertical"
          >
            {tabs.map((name, index) => (
              <button
                key={name}
                id={`settings-tab-${name}`}
                role="tab"
                aria-selected={tab === name}
                aria-controls={`settings-panel-${name}`}
                tabIndex={tab === name ? 0 : -1}
                onClick={() => setTab(name)}
                onKeyDown={(e) => {
                  let next: number;
                  if (e.key === "ArrowDown" || e.key === "ArrowRight")
                    next = (index + 1) % tabs.length;
                  else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
                    next = (index + tabs.length - 1) % tabs.length;
                  else if (e.key === "Home") next = 0;
                  else if (e.key === "End") next = tabs.length - 1;
                  else return;
                  e.preventDefault();
                  document
                    .getElementById(`settings-tab-${tabs[next]}`)
                    ?.focus();
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div
            key={tab}
            className="settings-panel display-tools"
            role="tabpanel"
            id={`settings-panel-${tab}`}
            aria-labelledby={`settings-tab-${tab}`}
            tabIndex={0}
          >
            {tab === "Markers" && (
              <>
                <section>
                  <h3>Appearance</h3>
                  <label className="control-row">
                    Palette
                    <select
                      aria-label="Color palette"
                      value={s.palette}
                      onChange={(e) =>
                        dispatch({
                          type: "palette",
                          names,
                          value: e.target.value as PaletteName,
                        })
                      }
                    >
                      {paletteNames.map((p) => (
                        <option key={p} value={p}>
                          {p[0].toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="control-row">
                    Marker style
                    <select
                      aria-label="Marker style"
                      value={s.markerPreset}
                      onChange={(e) =>
                        dispatch({
                          type: "markers",
                          names,
                          value: e.target.value as MarkerPreset,
                        })
                      }
                    >
                      <option value="circles">Filled circles</option>
                      <option value="hollow-circles">Hollow circles</option>
                      <option value="shapes">Filled shapes</option>
                      <option value="hollow-shapes">Hollow shapes</option>
                    </select>
                  </label>
                  <label className="control-row">
                    Point size
                    <div className="range-value">
                      <input
                        aria-label="Point size"
                        type="range"
                        min="3"
                        max="16"
                        value={s.size}
                        onChange={(e) =>
                          patch({ size: Number(e.target.value) })
                        }
                      />
                      <output>{s.size}</output>
                    </div>
                  </label>
                  <label className="control-row">
                    Marker outlines
                    <select
                      aria-label="Marker outlines"
                      value={s.outlineMode}
                      onChange={(e) =>
                        patch({
                          outlineMode: e.target.value as OutlineMode,
                        })
                      }
                    >
                      <option value="matching">Match fill</option>
                      <option value="darker">Darker than fill</option>
                      <option value="black">Black</option>
                    </select>
                  </label>
                  <label className="control-row">
                    Outline width
                    <div className="range-value">
                      <input
                        aria-label="Outline width"
                        type="range"
                        min={isHollow ? "0.5" : "0.4"}
                        max={isHollow ? "4" : "2"}
                        step="0.1"
                        value={s.outlineWidth}
                        onChange={(e) =>
                          patch({ outlineWidth: Number(e.target.value) })
                        }
                      />
                      <output>{s.outlineWidth}</output>
                    </div>
                  </label>

                  <label className="control-row">
                    Grayscale
                    <input
                      type="checkbox"
                      checked={s.grayscale}
                      onChange={(e) => patch({ grayscale: e.target.checked })}
                    />
                  </label>
                </section>
                <section>
                  <h3>
                    {isHollow
                      ? "Outline transparency"
                      : "Fill & boundary transparency"}
                  </h3>
                  {!isHollow && (
                    <Slider
                      label="Fill opacity (alpha)"
                      value={state.settings.opacity}
                      percent
                      onChange={(opacity) => patch({ opacity })}
                    />
                  )}
                  <Slider
                    label={
                      isHollow
                        ? "Outline opacity"
                        : "Boundary opacity (gamma)"
                    }
                    value={state.settings.outlineOpacity}
                    percent
                    onChange={(outlineOpacity) => patch({ outlineOpacity })}
                  />
                </section>
              </>
            )}
            {tab === "Labels" && (
              <>
                <section>
                  <h3>Labels</h3>
                  <label className="control-row">
                    Connect labels to centroids
                    <input
                      type="checkbox"
                      checked={s.groupLabelConnector}
                      onChange={(e) =>
                        patch({ groupLabelConnector: e.target.checked })
                      }
                    />
                  </label>
                  <label className="control-row">
                    Point labels
                    <select
                      aria-label="Point labels"
                      value={s.labels}
                      onChange={(e) =>
                        patch({ labels: e.target.value as LabelMode })
                      }
                    >
                      <option value="none">None</option>
                      <option value="sample">Sample ID</option>
                      <option value="population">Population</option>
                      <option value="full">Population + ID</option>
                    </select>
                  </label>
                  <label className="control-row">
                    Population labels
                    <input
                      type="checkbox"
                      checked={s.groupLabels}
                      onChange={(e) => {
                        patch({ groupLabels: e.target.checked });
                        dispatch({
                          type: "allPopulations",
                          names,
                          patch: { label: undefined },
                        });
                      }}
                    />
                  </label>
                  <label className="control-row">
                    Group label style
                    <select
                      aria-label="Group label style"
                      value={s.groupLabelStyle}
                      onChange={(e) =>
                        patch({
                          groupLabelStyle: e.target.value as GroupLabelStyle,
                        })
                      }
                    >
                      <option value="plain">Plain</option>
                      <option value="background">With background</option>
                      <option value="boxed">Boxed</option>
                    </select>
                  </label>
                </section>
              </>
            )}
            {tab === "Hover" && (
              <section>
                <h3>Hover information</h3>
                <label className="control-row">
                  Show hover information
                  <input
                    type="checkbox"
                    checked={s.hover !== "off"}
                    onChange={(e) =>
                      patch({ hover: e.target.checked ? "closest" : "off" })
                    }
                  />
                </label>
                <p className="field-note">
                  Choose values to display. IID is the sample ID; FID is the
                  population/group label.
                </p>
                {(
                  [
                    ["IID · Sample ID", "hoverIid"],
                    ["FID · Population / group", "hoverFid"],
                    ["PC coordinates", "hoverCoordinates"],
                  ] as const
                ).map(([label, key]) => (
                  <label className="control-row" key={key}>
                    {label}
                    <input
                      type="checkbox"
                      checked={s[key]}
                      onChange={(e) => patch({ [key]: e.target.checked })}
                    />
                  </label>
                ))}
              </section>
            )}
            {tab === "Chart" && (
              <>
                <section>
                  <h3>Plot heading</h3>
                  <label className="stacked-control">
                    Title
                    <input
                      aria-label="Plot title"
                      value={s.title}
                      placeholder="Optional plot title"
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </label>
                  <label className="stacked-control">
                    Subtitle
                    <input
                      aria-label="Plot subtitle"
                      value={s.subtitle}
                      placeholder="Optional subtitle"
                      onChange={(e) => patch({ subtitle: e.target.value })}
                    />
                  </label>
                </section>
                <section>
                  <h3>Chart area</h3>
                  <label className="control-row">
                    Background preset
                    <select
                      aria-label="Chart background preset"
                      value={
                        chartBackgroundPresets.some(
                          (p) => p.color === s.chartBackground,
                        )
                          ? s.chartBackground
                          : "custom"
                      }
                      onChange={(e) => {
                        if (e.target.value !== "custom")
                          patch({ chartBackground: e.target.value });
                      }}
                    >
                      {chartBackgroundPresets.map((p) => (
                        <option key={p.color} value={p.color}>
                          {p.name}
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <label className="control-row">
                    Background color
                    <input
                      aria-label="Chart background color"
                      type="color"
                      value={s.chartBackground}
                      onChange={(e) =>
                        patch({ chartBackground: e.target.value })
                      }
                    />
                  </label>

                  <Slider
                    label="Tick text size"
                    min={8}
                    max={28}
                    step={1}
                    value={s.tickFontSize}
                    onChange={(tickFontSize) => patch({ tickFontSize })}
                  />
                  <label className="control-row">
                    Axes thickness
                    <select
                      aria-label="Axes thickness"
                      value={s.axisLineWidth}
                      onChange={(e) =>
                        patch({ axisLineWidth: Number(e.target.value) })
                      }
                    >
                      {axisThicknessPresets.map((width) => (
                        <option key={width} value={width}>
                          {width}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Slider
                    label="Axis title size"
                    min={8}
                    max={32}
                    step={1}
                    value={s.axisTitleSize}
                    onChange={(axisTitleSize) => patch({ axisTitleSize })}
                  />
                  <label className="control-row">
                    Axis title weight
                    <select
                      aria-label="Axis title weight"
                      value={s.axisTitleWeight}
                      onChange={(e) =>
                        patch({ axisTitleWeight: Number(e.target.value) })
                      }
                    >
                      {[400, 500, 600, 700, 800].map((w) => (
                        <option key={w} value={w}>
                          {w === 400 ? "Normal" : w === 700 ? "Bold" : w}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="control-row">
                    Grid lines
                    <input
                      type="checkbox"
                      checked={s.grid}
                      onChange={(e) => patch({ grid: e.target.checked })}
                    />
                  </label>
                  <label className="control-row">
                    Equal axis scale
                    <input
                      type="checkbox"
                      checked={s.equalScale}
                      onChange={(e) => patch({ equalScale: e.target.checked })}
                    />
                  </label>
                  <AspectRatioControls state={state} dispatch={dispatch} />
                </section>
              </>
            )}
            {tab === "Legend" && (
              <>
                <section>
                  <h3>Legend layout</h3>
                  <LegendLayoutControls state={state} dispatch={dispatch} />
                  <label className="control-row">
                    Legend sample counts
                    <input
                      type="checkbox"
                      checked={s.legendCounts}
                      onChange={(e) =>
                        patch({ legendCounts: e.target.checked })
                      }
                    />
                  </label>
                </section>
              </>
            )}
            {tab === "Geometry" && (
              <>
                <section>
                  <h3>Population geometry</h3>
                  <label className="control-row">
                    All convex hulls
                    <input
                      type="checkbox"
                      checked={hulls}
                      onChange={(e) =>
                        dispatch({
                          type: "allPopulations",
                          names,
                          patch: { hull: e.target.checked },
                        })
                      }
                    />
                  </label>
                  <label className="control-row">
                    Hull opacity
                    <select
                      aria-label="Hull opacity"
                      value={s.hullOpacity}
                      onChange={(e) =>
                        patch({ hullOpacity: Number(e.target.value) })
                      }
                    >
                      <option value="0.05">Very low · 5%</option>
                      <option value="0.1">Low · 10%</option>
                      <option value="0.15">Medium · 15%</option>
                      <option value="0.3">High · 30%</option>
                      <option value="0.5">50%</option>
                      <option value="0.75">75%</option>
                    </select>
                  </label>
                  <label className="control-row">
                    All regression lines
                    <input
                      type="checkbox"
                      checked={regression}
                      onChange={(e) =>
                        dispatch({
                          type: "allPopulations",
                          names,
                          patch: { regression: e.target.checked },
                        })
                      }
                    />
                  </label>
                  <p className="field-note">
                    Right-click a legend entry to apply these to one population.
                    Regression fits y on x.
                  </p>
                </section>
              </>
            )}
            {tab === "Variance" && (
              <>
                <section>
                  <h3>Variance on axes</h3>
                  <label className="control-row">
                    Show variance percentages
                    <input
                      type="checkbox"
                      checked={state.settings.showVariance}
                      onChange={(e) =>
                        patch({ showVariance: e.target.checked })
                      }
                    />
                  </label>
                  <p className="field-note">
                    Without a known total, percentages show the share of loaded
                    PCs. To show total variance explained, supply the full
                    eigenvalue spectrum or its sum.
                  </p>
                  <label className="file-control">
                    Import eigenvalues (.eval)
                    <input
                      aria-label="Import eigenvalues"
                      type="file"
                      accept=".eval,.txt"
                      onChange={(e) => {
                        void read(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {state.spectrumName && (
                    <p className="field-note">
                      {state.spectrumName} · {state.spectrum.length} eigenvalues
                    </p>
                  )}
                  {state.spectrum.length > 0 && (
                    <button
                      className="button"
                      onClick={() =>
                        patch({
                          varianceTotal: state.spectrum.reduce(
                            (a, b) => a + b,
                            0,
                          ),
                        })
                      }
                    >
                      Use this as the full spectrum
                    </button>
                  )}
                  <label className="stacked-control">
                    Total variance (sum of all eigenvalues)
                    <input
                      aria-label="Total variance"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Unknown — use loaded PCs"
                      value={state.settings.varianceTotal ?? ""}
                      onChange={(e) =>
                        patch({
                          varianceTotal: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </label>
                  {state.settings.varianceTotal !== null &&
                    state.settings.varianceTotal <
                      (state.spectrum.length
                        ? state.spectrum
                        : dataset.eigenvalues
                      ).reduce((a, b) => a + b, 0) && (
                      <p role="alert">
                        Total variance must be at least the sum of the loaded
                        eigenvalues.
                      </p>
                    )}
                </section>
                {error && (
                  <p role="alert" className="data-warning">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <footer className="settings-footer">
          <button
            className="button"
            onClick={() => dispatch({ type: "clearMarks" })}
          >
            <X size={13} />
            Clear marks
          </button>
          <button
            className="button"
            onClick={() => dispatch({ type: "resetAppearance" })}
          >
            <RotateCcw size={13} />
            Reset styles
          </button>
          <button
            className="button"
            title="Restore default styles, visibility, axes, zoom and label positions"
            onClick={onReset}
          >
            Reset to defaults
          </button>
          <button className="button settings-done" onClick={onClose}>
            Done
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
