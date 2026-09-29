import React from "react";
import { Circle, RotateCcw, X } from "lucide-react";
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
  if (state.inspector === null) return null;

  const sample = dataset.samples[state.inspector];
  if (!sample) return null;

  const population = dataset.populations.find(
    (p) => p.name === sample.population,
  );
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
