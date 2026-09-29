import React from "react";
import { EyeOff, MoreHorizontal, Pentagon } from "lucide-react";
import type { Population } from "../../../core/models/dataset";
import type { ViewState } from "../../../state/viewState";
import { resolveMarkerStyle } from "../../../core/style/styleResolver";
import { VectorSwatch } from "../../primitives/VectorSwatch";
import type { Anchor } from "../../primitives/Popover";

export interface LegendRowProps {
  population: Population;
  state: ViewState;
  onToggleHidden: (name: string) => void;
  onOpenMenu: (name: string, anchor: Anchor) => void;
}

export function LegendRow({
  population,
  state,
  onToggleHidden,
  onOpenMenu,
}: LegendRowProps) {
  const custom = state.populations.get(population.name) ?? {};
  const isHidden = Boolean(custom.hidden);

  const resolved = resolveMarkerStyle({
    population,
    settings: state.settings,
    populationOverride: custom,
  });

  return (
    <div
      className={`legend-row ${isHidden ? "is-hidden" : ""}`}
      data-population={population.name}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenMenu(population.name, { x: e.clientX, y: e.clientY });
      }}
    >
      <button
        className="legend-item"
        aria-label={`${isHidden ? "Show" : "Hide"} ${population.name}`}
        title={`${population.name} — right-click to edit`}
        onClick={() => onToggleHidden(population.name)}
      >
        <VectorSwatch
          symbol={resolved.symbol}
          color={resolved.color}
          outlineColor={resolved.line.color}
          outlineWidth={resolved.line.width}
          fillOpacity={resolved.fillOpacity}
          outlineOpacity={resolved.outlineOpacity}
          size={14}
        />
        <span className="legend-name">{population.name}</span>
        {custom.hull && (
          <Pentagon
            size={11}
            className="hull-indicator"
            aria-label="Convex hull active"
          />
        )}
        {state.settings.legendCounts && (
          <span className="legend-count">{population.count}</span>
        )}
        {isHidden && (
          <span className="hidden-label">
            <EyeOff size={11} aria-hidden="true" />
            <span>Hidden</span>
          </span>
        )}
      </button>

      <button
        className="icon-button legend-more"
        aria-label={`Edit ${population.name}`}
        title={`Edit ${population.name}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onOpenMenu(population.name, { x: r.left - 230, y: r.bottom + 4 });
        }}
      >
        <MoreHorizontal size={14} />
      </button>
    </div>
  );
}
