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
    }
  }, [focusTitle]);

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
      title="Plot Settings"
      onClose={() => onClose(tab)}
      className="settings-modal"
      width={720}
    >
      <div className="settings-container">
        {/* Tab Navigation List */}
        <div className="settings-tabs" role="tablist" aria-label="Settings categories">
          {settingsTabs.map((name) => (
            <button
              key={name}
              id={`settings-tab-${name}`}
              role="tab"
              aria-selected={tab === name}
              aria-controls={`settings-panel-${name}`}
              className={`settings-tab-btn ${tab === name ? "active" : ""}`}
              onClick={() => selectTab(name)}
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
                  Background
                  <select
                    aria-label="Background tone"
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
                  Aspect ratio
                  <select
                    aria-label="Chart aspect ratio"
                    value={s.aspectRatio}
                    onChange={(e) =>
                      patch({ aspectRatio: e.target.value as any })
                    }
                  >
                    <option value="full">Fill available space</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:3">4:3 Standard</option>
                    <option value="16:9">16:9 Widescreen</option>
                  </select>
                </label>

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
                    <option value="matching">Same as fill</option>
                    <option value="darker">Darker than fill</option>
                    <option value="black">Black</option>
                  </select>
                </label>

                <Slider
                  label="Outline width"
                  value={s.outlineWidth}
                  min={isHollow ? 0.5 : 0.4}
                  max={isHollow ? 4 : 2}
                  step={0.1}
                  unit="px"
                  onChange={(outlineWidth) => patch({ outlineWidth })}
                />

                <Slider
                  label="Point opacity"
                  value={Math.round(s.opacity * 100)}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={(pct) => patch({ opacity: pct / 100 })}
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
                Position
                <select
                  aria-label="Legend position"
                  value={s.legendPosition}
                  onChange={(e) =>
                    patch({ legendPosition: e.target.value as any })
                  }
                >
                  <option value="right">Right</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="top">Top</option>
                </select>
              </label>

              <label className="control-row">
                Columns
                <select
                  aria-label="Legend columns"
                  value={s.legendColumns}
                  onChange={(e) =>
                    patch({ legendColumns: Number(e.target.value) as any })
                  }
                >
                  <option value={1}>1 Column</option>
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
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
                Enable hover tooltip
                <input
                  type="checkbox"
                  checked={s.hover !== "off"}
                  onChange={(e) =>
                    patch({ hover: e.target.checked ? "closest" : "off" })
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
                Convex hulls (all populations)
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
                Regression lines (all populations)
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

              <label className="control-row">
                Total variance sum override
                <input
                  aria-label="Total variance"
                  type="number"
                  step="any"
                  value={s.varianceTotal ?? ""}
                  placeholder="Auto (sum of eigenvalues)"
                  onChange={(e) =>
                    patch({
                      varianceTotal: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </label>

              <div className="section-divider" />

              <h4>Custom Spectrum File (.eval)</h4>
              <p className="field-note">
                Optionally load eigenvalues from a dedicated smartPCA .eval file:
              </p>
              <input
                type="file"
                accept=".eval"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const eigenvalues = parseSpectrum(text, dataset);
                    dispatch({
                      type: "spectrum",
                      value: eigenvalues,
                      name: file.name,
                    });
                    setSpectrumError("");
                  } catch (err: any) {
                    setSpectrumError(err.message ?? "Unable to parse .eval file");
                  }
                }}
              />
              {spectrumError && (
                <p className="data-warning">{spectrumError}</p>
              )}
              {state.spectrumName && (
                <p className="field-note">
                  Active spectrum: <strong>{state.spectrumName}</strong> (
                  {state.spectrum.length} eigenvalues)
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      <div className="modal-footer">
        <button
          className="text-button"
          onClick={() => {
            if (window.confirm("Reset all appearance settings to defaults?")) {
              onReset();
            }
          }}
        >
          <RotateCcw size={13} /> Reset appearance
        </button>
        <button
          className="btn-done btn-primary"
          onClick={() => onClose(tab)}
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
