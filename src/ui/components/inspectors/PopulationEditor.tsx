import React from "react";
import { RotateCcw } from "lucide-react";
import type { Population } from "../../../core/models/dataset";
import {
  markerSymbols,
  type GroupLabelStyle,
  type MarkerSymbol,
  type OutlineMode,
  type PopulationStyle,
} from "../../../core/models/settings";
import { resolvePopulationAppearance } from "../../../core/style/styleResolver";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
import { ColorPicker } from "../../primitives/ColorPicker";
import { ShapePicker } from "../../primitives/ShapePicker";
import { Slider } from "../../primitives/Slider";

export interface PopulationEditorProps {
  population: Population;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  hullPossible: boolean;
}

export function PopulationEditor({
  population,
  state,
  dispatch,
  hullPossible,
}: PopulationEditorProps) {
  const custom = state.populations.get(population.name) ?? {};
  const base = resolvePopulationAppearance(population, state.settings, custom);

  const isHollow =
    custom.symbol?.endsWith("-open") ||
    custom.markerTreatment === "hollow" ||
    (state.settings.markerPreset.startsWith("hollow") &&
      custom.markerTreatment !== "filled");

  const markerStyle = custom.markerPreset?.includes("shapes")
    ? isHollow
      ? "hollow-shapes"
      : "shapes"
    : custom.markerTreatment === "mixed"
      ? "mixed"
      : isHollow
        ? "hollow"
        : "filled";

  const patch = (patchValue: Partial<PopulationStyle>) =>
    dispatch({ type: "population", name: population.name, patch: patchValue });

  return (
    <div className="popover-body population-editor">
      <ColorPicker
        label="Population color"
        color={custom.color ?? population.color}
        onChange={(color) => patch({ color })}
      />

      <label className="control-row">
        Marker style
        <select
          aria-label="Population marker style"
          value={markerStyle}
          onChange={(e) => {
            const val = e.target.value;
            const switchingToHollow =
              val === "hollow" || val === "hollow-shapes";
            patch({
              symbol: (custom.symbol ?? base.symbol).replace(
                /-open$/,
                "",
              ) as MarkerSymbol,
              markerPreset:
                val === "shapes" || val === "hollow-shapes"
                  ? (val as any)
                  : undefined,
              markerTreatment:
                val === "shapes"
                  ? "filled"
                  : val === "hollow-shapes"
                    ? "hollow"
                    : (val as PopulationStyle["markerTreatment"]),
              ...(switchingToHollow && custom.outlineWidth === undefined
                ? { outlineWidth: 1.5, outlineMode: "matching" }
                : {}),
            });
          }}
        >
          <option value="filled">Filled</option>
          <option value="hollow">Hollow</option>
          <option value="mixed">Alternate filled / hollow</option>
          <option value="shapes">Varied filled shapes</option>
          <option value="hollow-shapes">Varied hollow shapes</option>
        </select>
      </label>

      <ShapePicker
        label="Population marker"
        symbols={markerSymbols.filter(
          (s: MarkerSymbol) => !s.endsWith("-open"),
        )}
        value={
          (custom.symbol ?? base.symbol).replace(/-open$/, "") as MarkerSymbol
        }
        onChange={(symbol) =>
          patch({
            symbol,
            markerPreset: undefined,
            markerTreatment:
              custom.markerTreatment === "mixed"
                ? "mixed"
                : isHollow
                  ? "hollow"
                  : "filled",
          })
        }
      />

      <Slider
        label="Point size"
        value={custom.size ?? state.settings.size}
        min={3}
        max={24}
        unit="px"
        onChange={(size) => patch({ size })}
      />

      <Slider
        label="Point opacity"
        value={Math.round((custom.opacity ?? state.settings.opacity) * 100)}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(pct) => patch({ opacity: pct / 100 })}
      />

      <div className="section-divider" />

      <label className="control-row">
        <span>Convex hull</span>
        <input
          aria-label="Convex hull"
          type="checkbox"
          checked={Boolean(custom.hull)}
          disabled={!hullPossible && !custom.hull}
          onChange={(e) => patch({ hull: e.target.checked })}
        />
      </label>

      {custom.hull && !hullPossible && (
        <p
          className="field-note"
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            margin: "4px 0",
          }}
        >
          A hull needs three non-collinear visible points. With two distinct
          points, a connecting line is shown instead.
        </p>
      )}

      <label className="control-row">
        <span>Regression line</span>
        <input
          aria-label="Regression line"
          type="checkbox"
          checked={Boolean(custom.regression)}
          onChange={(e) => patch({ regression: e.target.checked })}
        />
      </label>

      <div className="section-divider" />

      <label className="control-row">
        <span>Population label</span>
        <input
          aria-label="Population label"
          type="checkbox"
          checked={custom.label ?? state.settings.groupLabels}
          onChange={(e) => patch({ label: e.target.checked })}
        />
      </label>

      {(custom.label ?? state.settings.groupLabels) && (
        <>
          <label className="control-row">
            Label style
            <select
              aria-label="Population label style"
              value={custom.labelStyle ?? state.settings.groupLabelStyle}
              onChange={(e) =>
                patch({ labelStyle: e.target.value as GroupLabelStyle })
              }
            >
              <option value="plain">Plain text</option>
              <option value="background">With background</option>
              <option value="boxed">Boxed</option>
            </select>
          </label>

          <Slider
            label="Label font size"
            value={custom.labelSize ?? state.settings.groupLabelSize}
            min={8}
            max={28}
            unit="px"
            onChange={(labelSize) => patch({ labelSize })}
          />

          <label className="control-row">
            Connect to centroid
            <input
              type="checkbox"
              checked={
                custom.labelConnector ?? state.settings.groupLabelConnector
              }
              onChange={(e) => patch({ labelConnector: e.target.checked })}
            />
          </label>
        </>
      )}

      <details>
        <summary>More marker controls</summary>
        <Slider
          label="Population marker size"
          value={custom.size ?? state.settings.size}
          min={3}
          max={24}
          step={1}
          onChange={(size) => patch({ size })}
        />

        {!isHollow && (
          <Slider
            label="Population fill opacity"
            value={custom.opacity ?? state.settings.opacity}
            percent
            onChange={(opacity) => patch({ opacity })}
          />
        )}

        <Slider
          label="Population boundary opacity"
          value={custom.outlineOpacity ?? state.settings.outlineOpacity}
          percent
          onChange={(outlineOpacity) => patch({ outlineOpacity })}
        />

        <Slider
          label="Population boundary width"
          value={custom.outlineWidth ?? state.settings.outlineWidth}
          min={0.2}
          max={4}
          step={0.1}
          onChange={(outlineWidth) => patch({ outlineWidth })}
        />

        <label className="control-row">
          Boundary color
          <select
            aria-label="Population boundary mode"
            value={
              custom.outlineColor ? "custom" : (custom.outlineMode ?? "inherit")
            }
            onChange={(e) =>
              patch({
                outlineColor:
                  e.target.value === "custom"
                    ? (custom.outlineColor ?? "#000000")
                    : undefined,
                outlineMode:
                  e.target.value === "black" ||
                  e.target.value === "darker" ||
                  e.target.value === "matching"
                    ? e.target.value
                    : undefined,
              })
            }
          >
            <option value="inherit">Plot default</option>
            <option value="matching">Match fill</option>
            <option value="darker">Darker than fill</option>
            <option value="black">Black</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {custom.outlineColor && (
          <ColorPicker
            label="Population boundary color"
            color={custom.outlineColor}
            onChange={(outlineColor) => patch({ outlineColor })}
          />
        )}
      </details>

      <details>
        <summary>More label &amp; hull controls</summary>
        <Slider
          label="Group label size"
          value={custom.labelSize ?? state.settings.groupLabelSize}
          min={8}
          max={28}
          step={1}
          onChange={(labelSize) => patch({ labelSize })}
        />

        <Slider
          label="Point label size"
          value={custom.pointLabelSize ?? state.settings.pointLabelSize}
          min={7}
          max={24}
          step={1}
          onChange={(pointLabelSize) => patch({ pointLabelSize })}
        />

        <Slider
          label="Population label opacity"
          value={custom.labelOpacity ?? 1}
          percent
          onChange={(labelOpacity) => patch({ labelOpacity })}
        />

        <ColorPicker
          label="Population label color"
          color={custom.labelColor ?? custom.color ?? population.color}
          onChange={(labelColor) => patch({ labelColor })}
        />

        <label className="control-row">
          Point labels
          <select
            aria-label="Population point labels"
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
            <option value="inherit">Plot default</option>
            <option value="none">None</option>
            <option value="sample">Sample ID</option>
            <option value="population">Population</option>
            <option value="full">Population + sample</option>
          </select>
        </label>

        <Slider
          label="Population hull opacity"
          value={custom.hullOpacity ?? state.settings.hullOpacity}
          percent
          onChange={(hullOpacity) => patch({ hullOpacity })}
        />
      </details>

      <div className="popover-actions">
        <button
          className="text-button"
          onClick={() =>
            dispatch({
              type: "isolate",
              names: state.populationNames,
              name: population.name,
            })
          }
        >
          Isolate {population.name}
        </button>
        <button
          className="text-button"
          onClick={() =>
            dispatch({ type: "resetPopulation", name: population.name })
          }
        >
          <RotateCcw size={12} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
