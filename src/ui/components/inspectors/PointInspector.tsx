import React from "react";
import { Circle, RotateCcw, X } from "lucide-react";
import type { Dataset } from "../../../core/models/dataset";
import {
  markerSymbols,
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
  if (state.inspector === null) return null;

  const sample = dataset.samples[state.inspector];
  if (!sample) return null;

  const population = dataset.populations.find((p) => p.name === sample.population);
  if (!population) return null;

  const popStyle = state.populations.get(sample.population);
  const custom = state.points.get(sample.key) ?? {};

  const resolved = resolveMarkerStyle({
    population,
    settings: state.settings,
    populationOverride: popStyle,
    sampleOverride: custom,
  });

  const isHollow = resolved.isHollow;
  const markerStyle =
    custom.markerTreatment ??
    (custom.symbol
      ? isHollow
        ? "hollow"
        : "filled"
      : "inherit");

  const patch = (patchValue: Partial<SampleStyle>) =>
    dispatch({ type: "point", key: sample.key, patch: patchValue });

  const close = onClose ?? (() => dispatch({ type: "inspect", key: null }));

  const contents = (
    <div className="point-inspector popover-body">
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

      <p className="point-population">{sample.population}</p>

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
                val === "inherit"
                  ? undefined
                  : (val as "filled" | "hollow"),
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
        label="Marker shape"
        symbols={markerSymbols.filter((s: MarkerSymbol) => !s.endsWith("-open"))}
        value={
          custom.symbol
            ? (custom.symbol.replace(/-open$/, "") as MarkerSymbol)
            : (resolved.symbol.replace(/-open$/, "") as MarkerSymbol)
        }
        onChange={(symbol) => patch({ symbol })}
      />

      <ColorPicker
        label="Point color"
        color={custom.color ?? resolved.color}
        onChange={(color) => patch({ color })}
      />

      <Slider
        label="Point size"
        value={custom.size ?? resolved.size}
        min={3}
        max={24}
        unit="px"
        onChange={(size) => patch({ size })}
      />

      <label className="control-row">
        Marker outlines
        <select
          aria-label="Marker outlines"
          value={custom.outlineMode ?? state.settings.outlineMode}
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
        value={custom.outlineWidth ?? resolved.line.width}
        min={0.5}
        max={4}
        step={0.1}
        unit="px"
        onChange={(outlineWidth) => patch({ outlineWidth })}
      />

      <Slider
        label="Outline opacity"
        value={Math.round((custom.outlineOpacity ?? resolved.outlineOpacity) * 100)}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(pct) => patch({ outlineOpacity: pct / 100 })}
      />

      <div className="popover-actions">
        <button
          className="text-button"
          onClick={() => dispatch({ type: "resetPoint", key: sample.key })}
        >
          <RotateCcw size={12} /> Reset to defaults
        </button>
      </div>
    </div>
  );

  if (anchor) {
    return (
      <Popover
        title={sample.id}
        anchor={anchor}
        onClose={close}
      >
        {contents}
      </Popover>
    );
  }

  return contents;
}
