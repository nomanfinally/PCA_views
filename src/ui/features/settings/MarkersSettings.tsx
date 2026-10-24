import { paletteNames, type PaletteName } from "../../../core/color/palettes";
import {
  type MarkerPreset,
  type OutlineMode,
} from "../../../core/models/settings";
import { Slider } from "../../primitives/Slider";
import type { SettingsContext } from "./SettingsContext";

export function MarkersSettings({ context }: { context: SettingsContext }) {
  const { dataset, state, dispatch } = context;
  const s = state.settings;
  const names = dataset.populations.map((p) => p.name);
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  return (
    <>
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
    </>
  );
}
