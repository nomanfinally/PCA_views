import { legendPositions } from "../../../core/models/settings";
import type { SettingsContext } from "./SettingsContext";

export function LegendSettings({ context }: { context: SettingsContext }) {
  const { state, dispatch } = context;
  const s = state.settings;
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  return (
    <>
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
            onChange={(e) => patch({ legendPosition: e.target.value as any })}
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
    </>
  );
}
