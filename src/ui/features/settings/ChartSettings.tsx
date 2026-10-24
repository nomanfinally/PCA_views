import {
  aspectRatios,
  axisThicknessPresets,
  chartBackgroundPresets,
} from "../../../core/models/settings";
import { Slider } from "../../primitives/Slider";
import type { SettingsContext } from "./SettingsContext";

export function ChartSettings({ context }: { context: SettingsContext }) {
  const { state, dispatch, titleInputRef } = context;
  const s = state.settings;
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  return (
    <>
      <>
        <section>
          <h3>Titles</h3>
          <label className="control-row">
            Title
            <input
              ref={titleInputRef}
              aria-label="Plot title"
              type="text"
              value={s.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="None"
            />
          </label>
          <label className="control-row">
            Subtitle
            <input
              aria-label="Plot subtitle"
              type="text"
              value={s.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value })}
              placeholder="None"
            />
          </label>
        </section>

        <section>
          <h3>Canvas</h3>
          <label className="control-row">
            Preset
            <select
              aria-label="Chart background preset"
              value={s.chartBackground}
              onChange={(e) =>
                patch({
                  chartBackground: e.target.value,
                })
              }
            >
              {chartBackgroundPresets.map((bg) => (
                <option key={bg.color} value={bg.color}>
                  {bg.name}
                </option>
              ))}
            </select>
          </label>

          <label className="control-row">
            Background color
            <input
              aria-label="Chart background color"
              type="color"
              value={s.chartBackground}
              onChange={(e) => patch({ chartBackground: e.target.value })}
            />
          </label>

          <div
            className="aspect-options"
            role="group"
            aria-label="Chart aspect ratio"
          >
            {aspectRatios.map((ratio) => {
              const number =
                ratio === "full"
                  ? 1.7
                  : Number(ratio.split(":")[0]) / Number(ratio.split(":")[1]);
              return (
                <button
                  key={ratio}
                  type="button"
                  className={s.aspectRatio === ratio ? "active" : ""}
                  aria-label={`Chart ratio ${ratio === "full" ? "Full span" : ratio}`}
                  aria-pressed={s.aspectRatio === ratio}
                  onClick={() => patch({ aspectRatio: ratio })}
                >
                  <svg
                    width="32"
                    height="26"
                    viewBox="0 0 32 26"
                    aria-hidden="true"
                  >
                    <rect
                      x={(32 - Math.min(28, 20 * number)) / 2}
                      y={(26 - Math.min(20, 28 / number)) / 2}
                      width={Math.min(28, 20 * number)}
                      height={Math.min(20, 28 / number)}
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={ratio === "full" ? "3 2" : undefined}
                    />
                  </svg>
                  <span>{ratio === "full" ? "Full span" : ratio}</span>
                </button>
              );
            })}
          </div>

          <label className="control-row">
            Show grid lines
            <input
              type="checkbox"
              checked={s.grid}
              onChange={(e) => patch({ grid: e.target.checked })}
            />
          </label>

          <label className="control-row">
            Equal scale axes
            <input
              type="checkbox"
              checked={s.equalScale}
              onChange={(e) => patch({ equalScale: e.target.checked })}
            />
          </label>

          <Slider
            label="Tick text size"
            min={8}
            max={28}
            step={1}
            value={s.tickFontSize}
            onChange={(tickFontSize) => patch({ tickFontSize })}
          />

          <label className="control-row">
            Axes thickness
            <select
              aria-label="Axes thickness"
              value={String(s.axisLineWidth)}
              onChange={(e) => patch({ axisLineWidth: Number(e.target.value) })}
            >
              {axisThicknessPresets.map((width) => (
                <option key={width} value={String(width)}>
                  {String(width)}
                </option>
              ))}
            </select>
          </label>

          <label className="control-row">
            Axes border
            <select
              aria-label="Axes border"
              value={s.axisFrame ?? "enclosed"}
              onChange={(e) =>
                patch({
                  axisFrame: e.target.value as typeof s.axisFrame,
                })
              }
            >
              <option value="enclosed">Enclosed (all 4 sides)</option>
              <option value="standard">Two axes (bottom & left)</option>
            </select>
          </label>

          <Slider
            label="Axis title size"
            min={8}
            max={32}
            step={1}
            value={s.axisTitleSize}
            onChange={(axisTitleSize) => patch({ axisTitleSize })}
          />

          <label className="control-row">
            Axis title weight
            <select
              aria-label="Axis title weight"
              value={String(s.axisTitleWeight)}
              onChange={(e) =>
                patch({ axisTitleWeight: Number(e.target.value) })
              }
            >
              {[400, 500, 600, 700].map((weight) => (
                <option key={weight} value={String(weight)}>
                  {weight}
                </option>
              ))}
            </select>
          </label>
        </section>
      </>
    </>
  );
}
