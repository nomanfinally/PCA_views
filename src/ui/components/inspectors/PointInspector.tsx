import React, { useEffect, useState } from "react";
import { Circle, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import type { Dataset } from "../../../core/models/dataset";
import {
  markerSymbols,
  type GroupLabelStyle,
  type MarkerSymbol,
  type OutlineMode,
  type SampleStyle,
} from "../../../core/models/settings";
import { resolveMarkerStyle } from "../../../core/style/styleResolver";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
import { ColorPicker } from "../../primitives/ColorPicker";
import { ShapePicker } from "../../primitives/ShapePicker";
import { Slider } from "../../primitives/Slider";
import { Popover, type Anchor } from "../../primitives/Popover";

export interface PointInspectorProps {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  anchor?: Anchor | null;
  onClose?: () => void;
}

export function PointInspector({
  dataset,
  state,
  dispatch,
  anchor,
  onClose,
}: PointInspectorProps) {
  const [editingPop, setEditingPop] = useState(false);
  const [popValue, setPopValue] = useState("");

  if (state.inspector === null) return null;

  const sample = dataset.samples[state.inspector];
  if (!sample) return null;

  const population = dataset.populations.find(
    (p) => p.name === sample.population,
  );
  if (!population) return null;

  const popStyle = state.populations.get(sample.population);
  const custom = state.points.get(sample.key) ?? {};
  const isExcluded = Boolean(state.excludedSamples?.has(sample.key));

  const resolved = resolveMarkerStyle({
    population,
    settings: state.settings,
    populationOverride: popStyle,
    sampleOverride: custom,
  });

  const isHollow = resolved.isHollow;
  const markerStyle =
    custom.markerTreatment ??
    (custom.symbol ? (isHollow ? "hollow" : "filled") : "inherit");

  const patch = (patchValue: Partial<SampleStyle>) =>
    dispatch({ type: "point", key: sample.key, patch: patchValue });

  const close = onClose ?? (() => dispatch({ type: "inspect", key: null }));

  const contents = (
    <>
      {!anchor && (
        <div className="popover-header">
          <div>
            <span className="eyebrow">SAMPLE</span>
            <strong>{sample.id}</strong>
          </div>
          <button
            className="icon-button"
            aria-label="Close sample details"
            onClick={close}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Group ID (FID) with inline editing */}
      <div className="point-fid-section">
        {!editingPop ? (
          <div className="point-fid-display">
            <span
              className="swatch"
              style={{
                background: resolved.color,
                width: 10,
                height: 10,
                borderRadius: "50%",
                display: "inline-block",
                marginRight: 6,
                flexShrink: 0,
              }}
            />
            <span
              className="point-population"
              style={{ margin: 0, fontWeight: 600 }}
            >
              {sample.population}
            </span>
            <button
              type="button"
              className="text-button btn-tiny-action"
              onClick={() => {
                setPopValue(sample.population);
                setEditingPop(true);
              }}
              aria-label="Change group ID"
              title="Change group ID (FID)"
              style={{ marginLeft: "auto", fontSize: 11, padding: "1px 6px" }}
            >
              Change FID
            </button>
          </div>
        ) : (
          <div className="point-fid-edit">
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                type="text"
                className="point-fid-input"
                aria-label="Group ID (FID)"
                value={popValue}
                onChange={(e) => setPopValue(e.target.value)}
                list="inspector-population-datalist"
                placeholder="New group ID..."
                autoFocus
                style={{
                  fontSize: 12,
                  padding: "3px 6px",
                  borderRadius: 3,
                  border: "1px solid #ccc",
                  flex: 1,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (popValue.trim()) {
                      dispatch({
                        type: "setSamplePopulation",
                        key: sample.key,
                        population: popValue.trim(),
                      });
                      setEditingPop(false);
                    }
                  } else if (e.key === "Escape") {
                    setPopValue(sample.population);
                    setEditingPop(false);
                  }
                }}
              />
              <button
                type="button"
                className="btn-tiny"
                style={{ fontSize: 11, padding: "2px 6px" }}
                onClick={() => {
                  if (popValue.trim()) {
                    dispatch({
                      type: "setSamplePopulation",
                      key: sample.key,
                      population: popValue.trim(),
                    });
                    setEditingPop(false);
                  }
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn-tiny"
                style={{ fontSize: 11, padding: "2px 6px" }}
                onClick={() => {
                  setPopValue(sample.population);
                  setEditingPop(false);
                }}
              >
                ✕
              </button>
            </div>
            <datalist id="inspector-population-datalist">
              {dataset.populations.map((p) => (
                <option key={p.name} value={p.name} />
              ))}
            </datalist>
          </div>
        )}
      </div>

      {/* Unplot / Exclude toggle */}
      <div className="point-exclude-section" style={{ margin: "6px 0 8px" }}>
        <button
          type="button"
          className={`button ${isExcluded ? "btn-include" : "btn-unplot"}`}
          aria-label={isExcluded ? "Include sample in plot" : "Unplot sample"}
          title={
            isExcluded
              ? "Include this sample back in the plot, convex hulls, and calculations"
              : "Unplot this sample: removes dot and recalculates convex hulls & centroids"
          }
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            padding: "4px 8px",
            background: isExcluded ? "#ecfdf5" : "#fef2f2",
            color: isExcluded ? "#065f46" : "#991b1b",
            border: `1px solid ${isExcluded ? "#a7f3d0" : "#fecaca"}`,
            borderRadius: 3,
            cursor: "pointer",
            fontWeight: 500,
          }}
          onClick={() => {
            dispatch({
              type: "setSampleExcluded",
              key: sample.key,
              excluded: !isExcluded,
            });
          }}
        >
          {isExcluded ? (
            <>
              <Eye size={13} /> Include in plot
            </>
          ) : (
            <>
              <EyeOff size={13} /> Unplot sample (exclude)
            </>
          )}
        </button>
      </div>

      <div className="point-coordinates">
        <span>
          PC{state.x + 1}: <strong>{sample.pcs[state.x]}</strong>
        </span>
        <span>
          PC{state.y + 1}: <strong>{sample.pcs[state.y]}</strong>
        </span>
      </div>

      <label className="control-row mark-control">
        <span>
          <Circle size={13} aria-hidden="true" /> Red boundary
        </span>
        <input
          aria-label="Red boundary"
          type="checkbox"
          checked={Boolean(custom.marked)}
          onChange={(e) =>
            dispatch({
              type: "point",
              key: sample.key,
              patch: { marked: e.target.checked },
            })
          }
        />
      </label>

      <label className="control-row">
        Marker style
        <select
          aria-label="Sample marker style"
          value={markerStyle}
          onChange={(e) => {
            const val = e.target.value;
            patch({
              markerTreatment:
                val === "inherit" ? undefined : (val as "filled" | "hollow"),
              ...(val === "hollow" && custom.outlineWidth === undefined
                ? { outlineWidth: 1.5, outlineMode: "matching" }
                : {}),
            });
          }}
        >
          <option value="inherit">Inherit from population</option>
          <option value="filled">Filled</option>
          <option value="hollow">Hollow</option>
        </select>
      </label>

      <ShapePicker
        label="Sample shape"
        title="Sample shape"
        allowInherit={true}
        symbols={markerSymbols.filter(
          (s: MarkerSymbol) => !s.endsWith("-open"),
        )}
        value={
          custom.symbol
            ? (custom.symbol.replace(/-open$/, "") as MarkerSymbol)
            : undefined
        }
        onChange={(symbol) => patch({ symbol })}
      />

      <ColorPicker
        label="Sample color"
        color={custom.color ?? resolved.color}
        onChange={(color) => patch({ color })}
      />

      <Slider
        label="Sample size"
        value={custom.size ?? resolved.size}
        min={3}
        max={24}
        unit="px"
        onChange={(size) => patch({ size })}
      />

      <label className="control-row">
        Outline
        <select
          aria-label="Sample outline"
          value={
            custom.outlineColor ? "custom" : (custom.outlineMode ?? "inherit")
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "custom") {
              patch({
                outlineColor: custom.outlineColor ?? resolved.line.color,
                outlineMode: undefined,
              });
            } else if (val === "inherit") {
              patch({
                outlineColor: undefined,
                outlineMode: undefined,
              });
            } else {
              patch({
                outlineColor: undefined,
                outlineMode: val as OutlineMode,
              });
            }
          }}
        >
          <option value="inherit">Population default</option>
          <option value="matching">Match fill</option>
          <option value="darker">Darker than fill</option>
          <option value="black">Black</option>
          <option value="custom">Custom color</option>
        </select>
      </label>

      {custom.outlineColor && (
        <ColorPicker
          label="Sample outline color"
          color={custom.outlineColor}
          onChange={(outlineColor) => patch({ outlineColor })}
        />
      )}

      <label className="control-row">
        <span>Show IID label</span>
        <input
          aria-label="Show IID label"
          type="checkbox"
          checked={Boolean(custom.label)}
          onChange={(e) => patch({ label: e.target.checked })}
        />
      </label>

      <details className="sample-opacity">
        <summary>Label style &amp; text</summary>
        <label className="control-row">
          <span>Connect label to sample</span>
          <input
            aria-label="Connect label to sample"
            type="checkbox"
            checked={
              custom.labelConnector ??
              popStyle?.labelConnector ??
              state.settings.groupLabelConnector
            }
            onChange={(e) => patch({ labelConnector: e.target.checked })}
          />
        </label>

        <label className="control-row">
          <span>Label style</span>
          <select
            aria-label="Sample label style"
            value={custom.labelStyle ?? "inherit"}
            onChange={(e) =>
              patch({
                labelStyle:
                  e.target.value === "inherit"
                    ? undefined
                    : (e.target.value as GroupLabelStyle),
              })
            }
          >
            <option value="inherit">Population default</option>
            <option value="plain">plain</option>
            <option value="background">background</option>
            <option value="boxed">boxed</option>
          </select>
        </label>

        <Slider
          label="Sample label size"
          value={
            custom.labelSize ??
            popStyle?.labelSize ??
            state.settings.groupLabelSize
          }
          min={8}
          max={28}
          step={1}
          unit="px"
          onChange={(labelSize) => patch({ labelSize })}
        />

        <ColorPicker
          label="Sample label color"
          color={
            custom.labelColor ??
            popStyle?.labelColor ??
            custom.color ??
            resolved.color
          }
          onChange={(labelColor) => patch({ labelColor })}
        />

        <label className="control-row">
          <span>Point text</span>
          <select
            aria-label="Sample point labels"
            value={custom.pointLabels ?? "inherit"}
            onChange={(e) =>
              patch({
                pointLabels:
                  e.target.value === "inherit"
                    ? undefined
                    : (e.target.value as any),
              })
            }
          >
            <option value="inherit">Population default</option>
            <option value="none">None</option>
            <option value="sample">IID</option>
            <option value="population">FID</option>
            <option value="full">FID + IID</option>
          </select>
        </label>

        <Slider
          label="Point text size"
          value={
            custom.pointLabelSize ??
            popStyle?.pointLabelSize ??
            state.settings.pointLabelSize
          }
          min={7}
          max={24}
          step={1}
          unit="px"
          onChange={(pointLabelSize) => patch({ pointLabelSize })}
        />
      </details>

      <details className="sample-opacity">
        <summary>Fill &amp; boundary transparency</summary>
        <Slider
          label="Sample boundary width"
          value={custom.outlineWidth ?? resolved.line.width}
          min={0.2}
          max={4}
          step={0.1}
          unit="px"
          onChange={(outlineWidth) => patch({ outlineWidth })}
        />

        {!isHollow && (
          <Slider
            label="Sample fill opacity"
            value={custom.opacity ?? resolved.fillOpacity}
            percent
            onChange={(opacity) => patch({ opacity })}
          />
        )}

        <Slider
          label="Sample boundary opacity"
          value={custom.outlineOpacity ?? resolved.outlineOpacity}
          percent
          onChange={(outlineOpacity) => patch({ outlineOpacity })}
        />
      </details>

      <div className="popover-actions">
        <button
          className="text-button"
          onClick={() => dispatch({ type: "resetPoint", key: sample.key })}
        >
          <RotateCcw size={12} /> Reset this sample
        </button>
      </div>
    </>
  );

  if (anchor) {
    return (
      <Popover
        title={`Edit sample: ${sample.id}`}
        anchor={anchor}
        onClose={close}
      >
        <div className="popover-body sample-editor">{contents}</div>
      </Popover>
    );
  }

  return (
    <section className="point-inspector" aria-label="Sample details">
      {contents}
    </section>
  );
}
