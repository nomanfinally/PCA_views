import { Eye, EyeOff, Search, Settings2, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { convexHull } from "../../../core/geometry/hull";
import type { Dataset } from "../../../core/models/dataset";
import type { ViewAction } from "../../../state/viewActions";
import { filteredSamples } from "../../../state/viewSelectors";
import type { ViewState } from "../../../state/viewState";
import { useKeyboardTrap } from "../../hooks/useKeyboardTrap";
import { Popover, type Anchor } from "../../primitives/Popover";
import { LegendRow } from "./LegendRow";
import { PopulationEditor } from "./PopulationEditor";

export interface LegendDockProps {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  onSettings: () => void;
  compact?: boolean;
}

export function LegendDock({
  dataset,
  state,
  dispatch,
  onSettings,
  compact,
}: LegendDockProps) {
  const panelRef = useKeyboardTrap<HTMLElement>({
    active: Boolean(compact),
    onEscape: () => dispatch({ type: "legend" }),
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [limit, setLimit] = useState(100);
  const [menu, setMenu] = useState<{ name: string; anchor: Anchor } | null>(
    null,
  );

  const names = dataset.populations.map((p) => p.name);
  const hiddenCount = names.filter(
    (n) => state.populations.get(n)?.hidden,
  ).length;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dataset.populations.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!hiddenOnly || Boolean(state.populations.get(p.name)?.hidden)),
    );
  }, [dataset.populations, query, hiddenOnly, state.populations]);

  const activePop = menu
    ? (dataset.populations.find((p) => p.name === menu.name) ?? null)
    : null;

  const hullPossible = useMemo(() => {
    if (!activePop) return false;
    const popSamples = filteredSamples(dataset, state).filter(
      (s) => s.population === activePop.name,
    );
    const coords: [number, number][] = popSamples.map((s) => [
      s.pcs[state.x] ?? 0,
      s.pcs[state.y] ?? 0,
    ]);
    return (
      convexHull(coords).length > 0 ||
      (coords.length === 2 &&
        (coords[0][0] !== coords[1][0] || coords[0][1] !== coords[1][1]))
    );
  }, [
    activePop,
    dataset,
    state.search,
    state.excludedSamples,
    state.populations,
    state.x,
    state.y,
  ]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className="legend-dock"
      data-position={state.settings.legendPosition}
      style={
        { "--legend-cols": state.settings.legendColumns } as React.CSSProperties
      }
      aria-label="Population legend"
    >
      <div className="legend-header">
        <h2>
          Populations <span>{dataset.populations.length}</span>
        </h2>
        <div className="legend-header-tools">
          <button
            className="icon-button"
            aria-label="Search populations"
            title="Search populations"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen(!searchOpen);
              setQuery("");
            }}
          >
            <Search size={14} />
          </button>
          <button
            className="icon-button"
            aria-label="Legend layout"
            title="Legend position and columns"
            onClick={onSettings}
          >
            <Settings2 size={14} />
          </button>
          <button
            className="icon-button legend-close-btn"
            aria-label="Close legend"
            title="Close legend"
            onClick={() => dispatch({ type: "legend" })}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="legend-search search-field">
          <Search size={13} aria-hidden="true" />
          <input
            autoFocus
            aria-label="Find population"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(100);
            }}
            placeholder="Find population…"
          />
        </div>
      )}

      <div className="legend-actions">
        <button
          className="text-button"
          onClick={() =>
            dispatch({
              type: "allPopulations",
              names,
              patch: { hidden: false },
            })
          }
        >
          Show all
        </button>
        <button
          className="text-button"
          onClick={() =>
            dispatch({
              type: "allPopulations",
              names,
              patch: { hidden: true },
            })
          }
        >
          Hide all
        </button>
        {(hiddenCount > 0 || hiddenOnly) && (
          <button
            className={`hidden-filter ${hiddenOnly ? "active" : ""}`}
            aria-pressed={hiddenOnly}
            onClick={() => setHiddenOnly(!hiddenOnly)}
          >
            <EyeOff size={11} aria-hidden="true" />
            <span>{hiddenCount} hidden</span>
          </button>
        )}
      </div>

      <div className="legend-list" role="list">
        {matches.slice(0, limit).map((pop) => (
          <LegendRow
            key={pop.name}
            population={pop}
            state={state}
            onToggleHidden={(name) => {
              const cur = Boolean(state.populations.get(name)?.hidden);
              dispatch({
                type: "population",
                name,
                patch: { hidden: !cur },
              });
            }}
            onOpenMenu={(name, anchor) => setMenu({ name, anchor })}
          />
        ))}

        {matches.length > limit && (
          <button
            className="text-button more-populations"
            onClick={() => setLimit((l) => l + 100)}
          >
            Show 100 more
          </button>
        )}

        {matches.length === 0 && (
          <p className="legend-empty">
            {hiddenOnly
              ? "No hidden populations match."
              : "No populations match."}
          </p>
        )}
      </div>

      {menu && activePop && (
        <Popover
          title={activePop.name}
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
        >
          <PopulationEditor
            population={activePop}
            state={state}
            dispatch={dispatch}
            hullPossible={hullPossible}
          />
          <div className="popover-actions">
            <button
              onClick={() =>
                dispatch({
                  type: "population",
                  name: activePop.name,
                  patch: {
                    hidden: !state.populations.get(activePop.name)?.hidden,
                  },
                })
              }
            >
              {state.populations.get(activePop.name)?.hidden ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}{" "}
              {state.populations.get(activePop.name)?.hidden
                ? "Show population"
                : "Hide population"}
            </button>
            <button
              onClick={() => {
                dispatch({ type: "isolate", names, name: activePop.name });
                setMenu(null);
              }}
            >
              Show only this population
            </button>
            <button
              onClick={() =>
                dispatch({ type: "resetPopulation", name: activePop.name })
              }
            >
              Reset population style
            </button>
          </div>
        </Popover>
      )}
    </aside>
  );
}
