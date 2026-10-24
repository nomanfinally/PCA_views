import type { SettingsContext } from "./SettingsContext";

export function HoverSettings({ context }: { context: SettingsContext }) {
  const { state, dispatch } = context;
  const s = state.settings;
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  return (
    <>
      <section>
        <h3>Hover tooltip</h3>
        <label className="control-row">
          Show hover information
          <input
            aria-label="Show hover information"
            type="checkbox"
            checked={s.hover !== "off"}
            onChange={(e) =>
              patch({ hover: e.target.checked ? "closest" : "off" })
            }
          />
        </label>
        <label className="control-row">
          FID · Population / group
          <input
            aria-label="FID · Population / group"
            type="checkbox"
            checked={s.hoverFid}
            onChange={(e) => patch({ hoverFid: e.target.checked })}
          />
        </label>
        <label className="control-row">
          IID · Sample ID
          <input
            aria-label="IID · Sample ID"
            type="checkbox"
            checked={s.hoverIid}
            onChange={(e) => patch({ hoverIid: e.target.checked })}
          />
        </label>
        <label className="control-row">
          PC coordinates
          <input
            aria-label="PC coordinates"
            type="checkbox"
            checked={s.hoverCoordinates}
            onChange={(e) => patch({ hoverCoordinates: e.target.checked })}
          />
        </label>
        <p className="field-note">
          Hover tooltips display sample ID, population, and PC coordinates when
          hovering points on the canvas.
        </p>
      </section>
    </>
  );
}
