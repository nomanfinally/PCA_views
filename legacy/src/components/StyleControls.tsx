import type { Dispatch } from "react";
import {
  aspectRatios,
  legendPositions,
  type ViewAction,
  type ViewState,
} from "../domain/viewState";
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  percent = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  percent?: boolean;
}) {
  return (
    <label className="control-row">
      {label}
      <div className="range-value">
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output>{percent ? `${Math.round(value * 100)}%` : value}</output>
      </div>
    </label>
  );
}
export function LegendLayoutControls({
  state,
  dispatch,
}: {
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
}) {
  return (
    <>
      <label className="control-row">
        Legend position
        <select
          aria-label="Legend position"
          value={state.settings.legendPosition}
          onChange={(e) =>
            dispatch({
              type: "settings",
              patch: {
                legendPosition: e.target
                  .value as typeof state.settings.legendPosition,
              },
            })
          }
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
          value={state.settings.legendColumns}
          onChange={(e) =>
            dispatch({
              type: "settings",
              patch: { legendColumns: Number(e.target.value) },
            })
          }
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
    </>
  );
}
export function AspectRatioControls({
  state,
  dispatch,
}: {
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
}) {
  return (
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
            className={state.settings.aspectRatio === ratio ? "active" : ""}
            aria-label={`Chart ratio ${ratio === "full" ? "Full span" : ratio}`}
            aria-pressed={state.settings.aspectRatio === ratio}
            onClick={() =>
              dispatch({ type: "settings", patch: { aspectRatio: ratio } })
            }
          >
            <svg width="32" height="26" viewBox="0 0 32 26" aria-hidden="true">
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
  );
}
