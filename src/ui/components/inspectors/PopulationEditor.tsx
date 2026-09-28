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

  const isHollow = custom.symbol?.endsWith("-open") ||
    (custom.markerTreatment === "hollow") ||
    (state.settings.markerPreset.startsWith("hollow") && custom.markerTreatment !== "filled");

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
            const switchingToHollow = val === "hollow" || val === "hollow-shapes";
            patch({
              symbol: (custom.symbol ?? base.symbol).replace(/-open$/, "") as MarkerSymbol,
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
        symbols={markerSymbols.filter((s: MarkerSymbol) => !s.endsWith("-open"))}
        value={((custom.symbol ?? base.symbol).replace(/-open$/, "") as MarkerSymbol)}
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
        Convex hull
        <input
          type="checkbox"
          checked={Boolean(custom.hull)}
          disabled={!hullPossible && !custom.hull}
          onChange={(e) => patch({ hull: e.target.checked })}
        />
      </label>

      {custom.hull && (
        <Slider
          label="Hull opacity"
          value={Math.round((custom.hullOpacity ?? state.settings.hullOpacity) * 100)}
          min={5}
          max={90}
          step={5}
          unit="%"
          onChange={(pct) => patch({ hullOpacity: pct / 100 })}
        />
      )}

      <label className="control-row">
        Regression line
        <input
          type="checkbox"
          checked={Boolean(custom.regression)}
          onChange={(e) => patch({ regression: e.target.checked })}
        />
      </label>

      <div className="section-divider" />

      <label className="control-row">
        Population label
        <input
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
              aria-label="Label style"
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
              checked={custom.labelConnector ?? state.settings.groupLabelConnector}
              onChange={(e) => patch({ labelConnector: e.target.checked })}
            />
          </label>
        </>
      )}

      <div className="section-divider" />

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
        value={custom.outlineWidth ?? state.settings.outlineWidth}
        min={0.5}
        max={4}
        step={0.1}
        unit="px"
        onChange={(outlineWidth) => patch({ outlineWidth })}
      />

      <Slider
        label="Outline opacity"
        value={Math.round((custom.outlineOpacity ?? state.settings.outlineOpacity) * 100)}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(pct) => patch({ outlineOpacity: pct / 100 })}
      />

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
