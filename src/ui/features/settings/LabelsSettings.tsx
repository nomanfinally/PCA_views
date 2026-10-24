import {
  type GroupLabelStyle,
  type LabelMode,
} from "../../../core/models/settings";
import { Slider } from "../../primitives/Slider";
import type { SettingsContext } from "./SettingsContext";

export function LabelsSettings({ context }: { context: SettingsContext }) {
  const { dataset, state, dispatch } = context;
  const s = state.settings;
  const names = dataset.populations.map((p) => p.name);
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  return (
    <>
      <>
        <section>
          <h3>Point labels</h3>
          <label className="control-row">
            Point text
            <select
              aria-label="Point labels"
              value={s.labels}
              onChange={(e) => patch({ labels: e.target.value as LabelMode })}
            >
              <option value="none">None</option>
              <option value="sample">Sample ID</option>
              <option value="population">Population</option>
              <option value="full">Population + ID</option>
            </select>
          </label>

          <Slider
            label="Point label font size"
            value={s.pointLabelSize}
            min={7}
            max={24}
            step={1}
            unit="px"
            onChange={(pointLabelSize) => patch({ pointLabelSize })}
          />
        </section>

        <section>
          <h3>Population &amp; group labels</h3>
          <label className="control-row">
            Population labels
            <input
              type="checkbox"
              checked={s.groupLabels}
              onChange={(e) => {
                patch({ groupLabels: e.target.checked });
                dispatch({
                  type: "allPopulations",
                  names,
                  patch: { label: undefined },
                });
              }}
            />
          </label>

          <Slider
            label="Group label font size"
            value={s.groupLabelSize}
            min={8}
            max={28}
            step={1}
            unit="px"
            onChange={(groupLabelSize) => patch({ groupLabelSize })}
          />

          <label className="control-row">
            Connect labels to centroids
            <input
              type="checkbox"
              checked={s.groupLabelConnector}
              onChange={(e) => patch({ groupLabelConnector: e.target.checked })}
            />
          </label>

          <label className="control-row">
            Stick offscreen group labels to edge
            <input
              type="checkbox"
              checked={s.clampGroupLabelsToEdge}
              onChange={(e) =>
                patch({ clampGroupLabelsToEdge: e.target.checked })
              }
            />
          </label>

          <label className="control-row">
            Group label style
            <select
              aria-label="Group label style"
              value={s.groupLabelStyle}
              onChange={(e) =>
                patch({
                  groupLabelStyle: e.target.value as GroupLabelStyle,
                })
              }
            >
              <option value="plain">Plain text</option>
              <option value="background">With background</option>
              <option value="boxed">Boxed</option>
            </select>
          </label>
        </section>
      </>
    </>
  );
}
