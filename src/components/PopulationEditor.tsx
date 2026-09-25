import type { Dispatch } from "react";
import type { Population } from "../domain/types";
import {
  cycleValue,
  groupLabelStyles,
  markerSymbols,
  markerAppearance,
  type MarkerSymbol,
  type PopulationStyle,
  type ViewAction,
  type ViewState,
} from "../domain/viewState";
import { ColorControl } from "./ColorControl";
import { Slider } from "./StyleControls";
import { MarkerShapePicker } from "./MarkerShapePicker";
export function PopulationEditor({
  population,
  state,
  dispatch,
  hullPossible,
}: {
  population: Population;
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
  hullPossible: boolean;
}) {
  const s = state.populations.get(population.name) ?? {};
  const appearance = markerAppearance(population, state);
  const isHollow = appearance.symbol.endsWith("-open");
  const markerStyle = s.markerPreset?.includes("shapes")
    ? isHollow
      ? "hollow-shapes"
      : "shapes"
    : s.markerTreatment === "mixed"
      ? "mixed"
      : isHollow
        ? "hollow"
        : "filled";
  const patch = (value: Partial<PopulationStyle>) =>
    dispatch({ type: "population", name: population.name, patch: value });
  return (
    <div className="popover-body population-editor">
      <ColorControl
        label="Population color"
        color={s.color ?? population.color}
        onChange={(color) => patch({ color })}
      />
      <label className="control-row">
        Marker style
        <select
          aria-label="Population marker style"
          value={markerStyle}
          onChange={(e) => {
            const value = e.target.value;
            const switchingToHollow =
              value === "hollow" || value === "hollow-shapes";
            patch({
              symbol: appearance.symbol.replace(/-open$/, "") as MarkerSymbol,
              markerPreset:
                value === "shapes" || value === "hollow-shapes"
                  ? value
                  : undefined,
              markerTreatment:
                value === "shapes"
                  ? "filled"
                  : value === "hollow-shapes"
                    ? "hollow"
                    : (value as PopulationStyle["markerTreatment"]),
              ...(switchingToHollow
                ? {
                    ...(s.outlineWidth === undefined ? { outlineWidth: 1.5 } : {}),
                    ...(s.outlineMode === undefined ? { outlineMode: "matching" } : {}),
                  }
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
      <MarkerShapePicker
        label="Population marker"
        symbols={markerSymbols.filter((symbol) => !symbol.endsWith("-open"))}
        value={appearance.symbol.replace(/-open$/, "") as MarkerSymbol}
        onChange={(symbol) =>
          patch({
            symbol,
            markerPreset: undefined,
            markerTreatment:
              s.markerTreatment === "mixed"
                ? "mixed"
                : appearance.symbol.endsWith("-open")
                  ? "hollow"
                  : "filled",
          })
        }
      />
      <label className="control-row">
        Population label
        <input
          type="checkbox"
          checked={s.label ?? state.settings.groupLabels}
          onChange={(e) => patch({ label: e.target.checked })}
        />
      </label>
      <label className="control-row">
        Connect label to centroid
        <input
          type="checkbox"
          checked={s.labelConnector ?? state.settings.groupLabelConnector}
          onChange={(e) => patch({ labelConnector: e.target.checked })}
        />
      </label>
      <label className="control-row">
        Population label style
        <select
          aria-label="Population label style"
          value={s.labelStyle ?? "inherit"}
          onChange={(e) =>
            patch({
              labelStyle:
                e.target.value === "inherit"
                  ? undefined
                  : (e.target.value as PopulationStyle["labelStyle"]),
            })
          }
        >
          <option value="inherit">Plot default</option>
          {groupLabelStyles.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <button
        className="text-button"
        onClick={() =>
          patch({
            label: true,
            labelStyle: cycleValue(
              groupLabelStyles,
              s.labelStyle ?? state.settings.groupLabelStyle,
            ),
          })
        }
      >
        Cycle population label style
      </button>
      <label className="control-row">
        Convex hull
        <input
          type="checkbox"
          checked={!!s.hull}
          onChange={(e) => patch({ hull: e.target.checked })}
        />
      </label>
      {s.hull && !hullPossible && (
        <p className="field-note">
          A hull needs three non-collinear visible points. With two distinct
          points, a connecting line is shown instead.
        </p>
      )}
      <label className="control-row">
        Regression line
        <input
          type="checkbox"
          checked={!!s.regression}
          onChange={(e) => patch({ regression: e.target.checked })}
        />
      </label>
      <details>
        <summary>More marker controls</summary>
        <Slider
          label="Population marker size"
          value={s.size ?? state.settings.size}
          min={3}
          max={24}
          step={1}
          onChange={(size) => patch({ size })}
        />
        {!isHollow && (
          <Slider
            label="Population fill opacity"
            value={s.opacity ?? state.settings.opacity}
            percent
            onChange={(opacity) => patch({ opacity })}
          />
        )}
        <Slider
          label={
            isHollow
              ? "Population outline opacity"
              : "Population boundary opacity"
          }
          value={s.outlineOpacity ?? state.settings.outlineOpacity}
          percent
          onChange={(outlineOpacity) => patch({ outlineOpacity })}
        />
        <Slider
          label={
            isHollow
              ? "Population outline width"
              : "Population boundary width"
          }
          value={
            s.outlineWidth ??
            (isHollow ? 1.5 : state.settings.outlineWidth)
          }
          min={0.2}
          max={isHollow ? 4 : 3}
          step={0.1}
          onChange={(outlineWidth) => patch({ outlineWidth })}
        />
        <label className="control-row">
          {isHollow ? "Outline color" : "Boundary color"}
          <select
            aria-label="Population boundary mode"
            value={s.outlineColor ? "custom" : (s.outlineMode ?? "inherit")}
            onChange={(e) =>
              patch({
                outlineColor:
                  e.target.value === "custom"
                    ? (s.outlineColor ?? "#000000")
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
        {s.outlineColor && (
          <ColorControl
            label="Population boundary color"
            color={s.outlineColor}
            onChange={(outlineColor) => patch({ outlineColor })}
          />
        )}
      </details>
      <details>
        <summary>More label &amp; hull controls</summary>
        <Slider
          label="Group label size"
          value={s.labelSize ?? state.settings.groupLabelSize}
          min={8}
          max={28}
          step={1}
          onChange={(labelSize) => patch({ labelSize })}
        />
        <Slider
          label="Point label size"
          value={s.pointLabelSize ?? state.settings.pointLabelSize}
          min={7}
          max={24}
          step={1}
          onChange={(pointLabelSize) => patch({ pointLabelSize })}
        />
        <Slider
          label="Population label opacity"
          value={s.labelOpacity ?? 1}
          percent
          onChange={(labelOpacity) => patch({ labelOpacity })}
        />
        <ColorControl
          label="Population label color"
          color={s.labelColor ?? s.color ?? population.color}
          onChange={(labelColor) => patch({ labelColor })}
        />
        <label className="control-row">
          Point labels
          <select
            aria-label="Population point labels"
            value={s.pointLabels ?? "inherit"}
            onChange={(e) =>
              patch({
                pointLabels:
                  e.target.value === "inherit"
                    ? undefined
                    : (e.target.value as PopulationStyle["pointLabels"]),
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
          value={s.hullOpacity ?? state.settings.hullOpacity}
          percent
          onChange={(hullOpacity) => patch({ hullOpacity })}
        />
        <button
          className="text-button"
          onClick={() =>
            patch({
              hull: true,
              hullOpacity: cycleValue(
                [0.05, 0.15, 0.3, 0.5, 0.75],
                s.hullOpacity ?? state.settings.hullOpacity,
              ),
            })
          }
        >
          Cycle population hull opacity
        </button>
      </details>
    </div>
  );
}
