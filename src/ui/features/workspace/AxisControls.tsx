import {
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  PanelRight,
  Search,
  X,
} from "lucide-react";
import React from "react";
import type { Dataset } from "../../../core/models/dataset";
import type { ViewAction } from "../../../state/viewActions";
import { selectAxisVariance } from "../../../state/viewSelectors";
import type { ViewState } from "../../../state/viewState";
export function AxisControls({
  dataset,
  state,
  dispatch,
  isMobile,
  isCompact,
  maximizedPlot,
  onToggleMaximize,
  floating = false,
}: {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  isMobile: boolean;
  isCompact: boolean;
  maximizedPlot: boolean;
  onToggleMaximize: () => void;
  floating?: boolean;
}) {
  return (
    <div className="workspace-controls">
      <div className={floating ? "compact-axes" : "axis-pickers"}>
        <label className="axis-select-label">
          <span className="axis-badge">X</span>
          <select
            aria-label="Horizontal axis"
            value={state.x}
            onChange={(e) =>
              dispatch({
                type: "axes",
                x: Number(e.target.value),
                y: state.y,
              })
            }
          >
            {Array.from({ length: dataset.pcCount }, (_, i) => {
              const variance = selectAxisVariance(dataset, state, i);
              return (
                <option key={i} value={i} disabled={i === state.y}>
                  PC{i + 1}
                  {variance != null ? ` (${variance.toFixed(1)}%)` : ""}
                </option>
              );
            })}
          </select>
        </label>

        <button
          className="icon-button swap-axes-btn"
          aria-label="Swap axes"
          title="Swap horizontal and vertical axes"
          onClick={() => dispatch({ type: "axes", x: state.y, y: state.x })}
        >
          <ArrowLeftRight size={14} />
        </button>

        <label className="axis-select-label">
          <span className="axis-badge">Y</span>
          <select
            aria-label="Vertical axis"
            value={state.y}
            onChange={(e) =>
              dispatch({
                type: "axes",
                x: state.x,
                y: Number(e.target.value),
              })
            }
          >
            {Array.from({ length: dataset.pcCount }, (_, i) => {
              const variance = selectAxisVariance(dataset, state, i);
              return (
                <option key={i} value={i} disabled={i === state.x}>
                  PC{i + 1}
                  {variance != null ? ` (${variance.toFixed(1)}%)` : ""}
                </option>
              );
            })}
          </select>
        </label>
      </div>
      <div className="search-tools">
        {!floating && (
          <>
            <div className="sample-search search-field">
              <Search size={13} aria-hidden="true" />
              <input
                aria-label="Search samples"
                placeholder={
                  isMobile ? "Search…" : "Find sample or population…"
                }
                value={state.search}
                onChange={(e) =>
                  dispatch({ type: "search", value: e.target.value })
                }
              />
              {state.search && (
                <button
                  className="icon-button"
                  aria-label="Clear sample search"
                  onClick={() => dispatch({ type: "search", value: "" })}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              className={`icon-button ${state.legend ? "active" : ""}`}
              aria-label="Toggle legend"
              title="Toggle legend dock"
              aria-pressed={state.legend}
              onClick={() => dispatch({ type: "legend" })}
            >
              <PanelRight size={17} />
            </button>
          </>
        )}

        {isCompact && (
          <button
            className={`icon-button mobile-maximize-btn ${maximizedPlot ? "active" : ""}`}
            aria-label={
              maximizedPlot ? "Restore normal view" : "Maximize plot area"
            }
            title={maximizedPlot ? "Restore normal view" : "Maximize plot area"}
            onClick={() => onToggleMaximize()}
          >
            {maximizedPlot ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
