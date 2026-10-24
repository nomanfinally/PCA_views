import { Slider } from "../../primitives/Slider";
import type { SettingsContext } from "./SettingsContext";

export function GeometrySettings({ context }: { context: SettingsContext }) {
  const { dataset, state, dispatch } = context;
  const s = state.settings;
  const names = dataset.populations.map((p) => p.name);
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  const anyHulls = names.some((n) => state.populations.get(n)?.hull);
  const anyRegression = names.some((n) => state.populations.get(n)?.regression);
  return (
    <>
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
    </>
  );
}
