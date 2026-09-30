import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { Dataset } from "../../../core/models/dataset";
import type {
  GroupLabelStyle,
  LabelMode,
  MarkerPreset,
  OutlineMode,
} from "../../../core/models/settings";
import {
  aspectRatios,
  chartBackgroundPresets,
  axisThicknessPresets,
  legendPositions,
} from "../../../core/models/settings";
import { paletteNames, type PaletteName } from "../../../core/color/palettes";
import { parseSpectrum } from "../../../core/parsers/parseSpectrum";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
import { Modal } from "../../primitives/Modal";
import { Slider } from "../../primitives/Slider";

export const settingsTabs = [
  "Chart",
  "Markers",
  "Labels",
  "Legend",
  "Hover",
  "Geometry",
  "Variance",
] as const;

export type SettingsTab = (typeof settingsTabs)[number];

export interface SettingsDialogProps {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  initialTab?: SettingsTab;
  focusTitle?: boolean;
  onClose: (lastTab?: SettingsTab) => void;
  onTabChange?: (tab: SettingsTab) => void;
  onReset: () => void;
}

export function SettingsDialog({
  dataset,
  state,
  dispatch,
  initialTab = "Chart",
  focusTitle,
  onClose,
  onTabChange,
  onReset,
}: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [spectrumError, setSpectrumError] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const selectTab = (nextTab: SettingsTab) => {
    setTab(nextTab);
    onTabChange?.(nextTab);
  };

  useEffect(() => {
    if (focusTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    } else {
      document.getElementById(`settings-tab-${tab}`)?.focus();
    }
  }, [tab, focusTitle]);

  const names = dataset.populations.map((p) => p.name);
  const s = state.settings;
  const isHollow = s.markerPreset.startsWith("hollow");

  const patch = (settingsPatch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch: settingsPatch });

  const anyHulls = names.some((n) => state.populations.get(n)?.hull);
  const anyRegression = names.some((n) => state.populations.get(n)?.regression);

  return (
    <Modal
      isOpen={true}
      title="Plot settings"
      onClose={() => onClose(tab)}
      className="settings-modal settings-dialog"
      width={880}
      maxWidth="min(95vw, 920px)"
      noPadding={true}
      closeLabel="Close settings"
    >
      <div className="settings-layout settings-container">
        {/* Tab Navigation List */}
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
        >
          {settingsTabs.map((name, index) => (
            <button
              key={name}
              id={`settings-tab-${name}`}
              role="tab"
              aria-selected={tab === name}
              aria-controls={`settings-panel-${name}`}
              tabIndex={tab === name ? 0 : -1}
              className={`settings-tab-btn ${tab === name ? "active" : ""}`}
              onClick={(e) => {
                selectTab(name);
                e.currentTarget.focus();
              }}
              onKeyDown={(e) => {
                let next: number;
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  next = (index + 1) % settingsTabs.length;
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  next =
                    (index + settingsTabs.length - 1) % settingsTabs.length;
                } else if (e.key === "Home") {
                  next = 0;
                } else if (e.key === "End") {
                  next = settingsTabs.length - 1;
                } else {
                  return;
                }
                e.preventDefault();
                document
                  .getElementById(`settings-tab-${settingsTabs[next]}`)
                  ?.focus();
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div
          className="settings-panel display-tools"
          role="tabpanel"
          id={`settings-panel-${tab}`}
          aria-labelledby={`settings-tab-${tab}`}
          aria-label={tab}
        >
          {tab === "Chart" && (
            <>
              <section>
                <h3>Titles</h3>
                <label className="control-row">
                  Title
                  <input
                    ref={titleInputRef}
                    aria-label="Plot title"
                    type="text"
                    value={s.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="None"
                  />
                </label>
                <label className="control-row">
                  Subtitle
                  <input
                    aria-label="Plot subtitle"
                    type="text"
                    value={s.subtitle}
                    onChange={(e) => patch({ subtitle: e.target.value })}
                    placeholder="None"
                  />
                </label>
              </section>

              <section>
                <h3>Canvas</h3>
                <label className="control-row">
                  Preset
                  <select
                    aria-label="Chart background preset"
                    value={s.chartBackground}
                    onChange={(e) =>
                      patch({
                        chartBackground: e.target.value,
                      })
                    }
                  >
                    {chartBackgroundPresets.map((bg) => (
                      <option key={bg.color} value={bg.color}>
                        {bg.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="control-row">
                  Background color
                  <input
                    aria-label="Chart background color"
                    type="color"
                    value={s.chartBackground}
                    onChange={(e) => patch({ chartBackground: e.target.value })}
                  />
                </label>

                <div
                  className="aspect-options"
                  role="group"
                  aria-label="Chart aspect ratio"
                >
                  {aspectRatios.map((ratio) => {
                    const number =
                      ratio === "full"
                        ? 1.7
                        : Number(ratio.split(":")[0]) /
                          Number(ratio.split(":")[1]);
                    return (
                      <button
                        key={ratio}
                        type="button"
                        className={s.aspectRatio === ratio ? "active" : ""}
                        aria-label={`Chart ratio ${ratio === "full" ? "Full span" : ratio}`}
                        aria-pressed={s.aspectRatio === ratio}
                        onClick={() => patch({ aspectRatio: ratio })}
                      >
                        <svg
                          width="32"
                          height="26"
                          viewBox="0 0 32 26"
                          aria-hidden="true"
                        >
                          <rect
                            x={(32 - Math.min(28, 20 * number)) / 2}
                            y={(26 - Math.min(20, 28 / number)) / 2}
                            width={Math.min(28, 20 * number)}
                            height={Math.min(20, 28 / number)}
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray={
                              ratio === "full" ? "3 2" : undefined
                            }
                          />
                        </svg>
                        <span>{ratio === "full" ? "Full span" : ratio}</span>
                      </button>
                    );
                  })}
                </div>

                <label className="control-row">
                  Show grid lines
                  <input
                    type="checkbox"
                    checked={s.grid}
                    onChange={(e) => patch({ grid: e.target.checked })}
                  />
                </label>

                <label className="control-row">
                  Equal scale axes
                  <input
                    type="checkbox"
                    checked={s.equalScale}
                    onChange={(e) => patch({ equalScale: e.target.checked })}
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
                    value={String(s.axisLineWidth)}
                    onChange={(e) =>
                      patch({ axisLineWidth: Number(e.target.value) })
                    }
                  >
                    {axisThicknessPresets.map((width) => (
                      <option key={width} value={String(width)}>
                        {String(width)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="control-row">
                  Axes border
                  <select
                    aria-label="Axes border"
                    value={s.axisFrame ?? "enclosed"}
                    onChange={(e) =>
                      patch({
                        axisFrame: e.target.value as typeof s.axisFrame,
                      })
                    }
                  >
                    <option value="enclosed">Enclosed (all 4 sides)</option>
                    <option value="standard">Two axes (bottom & left)</option>
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
                    value={String(s.axisTitleWeight)}
                    onChange={(e) =>
                      patch({ axisTitleWeight: Number(e.target.value) })
                    }
                  >
                    {[400, 500, 600, 700].map((weight) => (
                      <option key={weight} value={String(weight)}>
                        {weight}
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            </>
          )}

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

                <Slider
                  label="Point size"
                  value={s.size}
                  min={3}
                  max={20}
                  unit="px"
                  onChange={(size) => patch({ size })}
                />

                <Slider
                  label="Point fill opacity"
                  value={Math.round(s.opacity * 100)}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={(pct) => patch({ opacity: pct / 100 })}
                />

                <label className="control-row">
                  Marker outlines
                  <select
                    aria-label="Marker outlines"
                    value={s.outlineMode}
                    onChange={(e) =>
                      patch({ outlineMode: e.target.value as OutlineMode })
                    }
                  >
                    <option value="matching">Match fill</option>
                    <option value="darker">Darker than fill</option>
                    <option value="black">Black</option>
                  </select>
                </label>

                <Slider
                  label="Outline width"
                  value={s.outlineWidth}
                  min={0.5}
                  max={4}
                  step={0.1}
                  unit="px"
                  onChange={(outlineWidth) => patch({ outlineWidth })}
                />

                <Slider
                  label="Outline opacity"
                  value={Math.round(s.outlineOpacity * 100)}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={(pct) => patch({ outlineOpacity: pct / 100 })}
                />

                <label className="control-row">
                  Grayscale
                  <input
                    type="checkbox"
                    checked={s.grayscale}
                    onChange={(e) => patch({ grayscale: e.target.checked })}
                  />
                </label>
              </section>
            </>
          )}

          {tab === "Labels" && (
            <>
              <section>
                <h3>Point labels</h3>
                <label className="control-row">
                  Point text
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

                <Slider
                  label="Point label font size"
                  value={s.pointLabelSize}
                  min={7}
                  max={24}
                  step={1}
                  unit="px"
                  onChange={(pointLabelSize) => patch({ pointLabelSize })}
                />
              </section>

              <section>
                <h3>Population &amp; group labels</h3>
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

                <Slider
                  label="Group label font size"
                  value={s.groupLabelSize}
                  min={8}
                  max={28}
                  step={1}
                  unit="px"
                  onChange={(groupLabelSize) => patch({ groupLabelSize })}
                />

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
                  Stick offscreen group labels to edge
                  <input
                    type="checkbox"
                    checked={s.clampGroupLabelsToEdge}
                    onChange={(e) =>
                      patch({ clampGroupLabelsToEdge: e.target.checked })
                    }
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
                    <option value="plain">Plain text</option>
                    <option value="background">With background</option>
                    <option value="boxed">Boxed</option>
                  </select>
                </label>
              </section>
            </>
          )}

          {tab === "Legend" && (
            <section>
              <h3>Legend layout</h3>
              <label className="control-row">
                Show legend
                <input
                  type="checkbox"
                  checked={state.legend}
                  onChange={() => dispatch({ type: "legend" })}
                />
              </label>

              <label className="control-row">
                Legend position
                <select
                  aria-label="Legend position"
                  value={s.legendPosition}
                  onChange={(e) =>
                    patch({ legendPosition: e.target.value as any })
                  }
                >
                  {legendPositions.map((p) => (
                    <option key={p} value={p}>
                      {p.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control-row">
                Legend columns
                <select
                  aria-label="Legend columns"
                  value={s.legendColumns}
                  onChange={(e) =>
                    patch({ legendColumns: Number(e.target.value) as any })
                  }
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control-row">
                Show sample counts
                <input
                  type="checkbox"
                  checked={s.legendCounts}
                  onChange={(e) => patch({ legendCounts: e.target.checked })}
                />
              </label>
            </section>
          )}

          {tab === "Hover" && (
            <section>
              <h3>Hover tooltip</h3>
              <label className="control-row">
                Show hover information
                <input
                  aria-label="Show hover information"
                  type="checkbox"
                  checked={s.hover !== "off"}
                  onChange={(e) =>
                    patch({ hover: e.target.checked ? "closest" : "off" })
                  }
                />
              </label>
              <label className="control-row">
                FID · Population / group
                <input
                  aria-label="FID · Population / group"
                  type="checkbox"
                  checked={s.hoverFid}
                  onChange={(e) => patch({ hoverFid: e.target.checked })}
                />
              </label>
              <label className="control-row">
                IID · Sample ID
                <input
                  aria-label="IID · Sample ID"
                  type="checkbox"
                  checked={s.hoverIid}
                  onChange={(e) => patch({ hoverIid: e.target.checked })}
                />
              </label>
              <label className="control-row">
                PC coordinates
                <input
                  aria-label="PC coordinates"
                  type="checkbox"
                  checked={s.hoverCoordinates}
                  onChange={(e) =>
                    patch({ hoverCoordinates: e.target.checked })
                  }
                />
              </label>
              <p className="field-note">
                Hover tooltips display sample ID, population, and PC coordinates
                when hovering points on the canvas.
              </p>
            </section>
          )}

          {tab === "Geometry" && (
            <section>
              <h3>Geometry overlays</h3>
              <label className="control-row">
                All convex hulls
                <input
                  type="checkbox"
                  checked={anyHulls}
                  onChange={(e) =>
                    dispatch({
                      type: "allPopulations",
                      names,
                      patch: { hull: e.target.checked },
                    })
                  }
                />
              </label>

              <Slider
                label="Hull fill opacity"
                value={Math.round(s.hullOpacity * 100)}
                min={5}
                max={80}
                step={5}
                unit="%"
                onChange={(pct) => patch({ hullOpacity: pct / 100 })}
              />

              <label className="control-row">
                All regression lines
                <input
                  type="checkbox"
                  checked={anyRegression}
                  onChange={(e) =>
                    dispatch({
                      type: "allPopulations",
                      names,
                      patch: { regression: e.target.checked },
                    })
                  }
                />
              </label>
            </section>
          )}

          {tab === "Variance" && (
            <section>
              <h3>Explained Variance</h3>
              <label className="control-row">
                Display variance on axis titles
                <input
                  type="checkbox"
                  checked={s.showVariance}
                  onChange={(e) => patch({ showVariance: e.target.checked })}
                />
              </label>

              <p className="field-note">
                To show total variance explained, supply the full eigenvalue
                spectrum or its sum.
              </p>

              <label className="file-control control-row">
                Import eigenvalues (.eval)
                <input
                  aria-label="Import eigenvalues"
                  type="file"
                  accept=".eval,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setSpectrumError("");
                      const text = await file.text();
                      const eigenvalues = parseSpectrum(text, dataset);
                      dispatch({
                        type: "spectrum",
                        value: eigenvalues,
                        name: file.name,
                      });
                    } catch (err: any) {
                      setSpectrumError(
                        err.message ?? "Unable to parse .eval file",
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </label>

              {spectrumError && (
                <p className="field-error" role="alert">
                  {spectrumError}
                </p>
              )}

              {state.spectrumName && (
                <p className="field-note">
                  Active spectrum: <strong>{state.spectrumName}</strong> (
                  {state.spectrum.length} eigenvalues)
                </p>
              )}

              {state.spectrum.length > 0 && (
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    patch({
                      varianceTotal: state.spectrum.reduce((a, b) => a + b, 0),
                    })
                  }
                >
                  Use this as the full spectrum
                </button>
              )}

              <label className="control-row">
                Total variance (sum of all eigenvalues)
                <input
                  aria-label="Total variance"
                  type="number"
                  step="any"
                  placeholder="Unknown — use loaded PCs"
                  value={s.varianceTotal ?? ""}
                  onChange={(e) =>
                    patch({
                      varianceTotal: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </label>
            </section>
          )}
        </div>
      </div>

      <div className="settings-footer modal-footer">
        <button
          className="button"
          onClick={() => dispatch({ type: "clearMarks" })}
        >
          <X size={13} /> Clear marks
        </button>
        <button
          className="button"
          onClick={() => dispatch({ type: "resetAppearance" })}
        >
          <RotateCcw size={13} /> Reset styles
        </button>
        <button
          className="button"
          title="Restore default styles, visibility, axes, zoom and label positions"
          onClick={onReset}
        >
          Reset to defaults
        </button>
        <button className="button settings-done" onClick={() => onClose(tab)}>
          Done
        </button>
      </div>
    </Modal>
  );
}
