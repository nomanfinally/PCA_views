import { PopulationEditor } from "./PopulationEditor";
import { MarkerSwatch } from "./MarkerSwatch";
import { useState, type Dispatch } from "react";
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Settings2,
  Pentagon,
  Search,
} from "lucide-react";
import type { Dataset } from "../domain/types";
import type { ViewAction, ViewState } from "../domain/viewState";
import { markerAppearance } from "../domain/viewState";
import { convexHull } from "../domain/geometry";
import { Popover, type Anchor } from "./Popover";

export function Legend({
  dataset,
  state,
  dispatch,
  onSettings,
}: {
  dataset: Dataset;
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
  onSettings: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [limit, setLimit] = useState(100);
  const [menu, setMenu] = useState<{ name: string; anchor: Anchor } | null>(
    null,
  );
  const names = dataset.populations.map((p) => p.name);
  const hidden = names.filter(
    (name) => state.populations.get(name)?.hidden,
  ).length;
  const matches = dataset.populations.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (!hiddenOnly || state.populations.get(p.name)?.hidden),
  );
  const population = menu
    ? dataset.populations.find((p) => p.name === menu.name)!
    : null;
  const style = population
    ? (state.populations.get(population.name) ?? {})
    : {};
  const hullPossible = population
    ? convexHull(
        dataset.samples
          .filter(
            (s) =>
              s.population === population.name &&
              (!state.search ||
                s.id
                  .toLowerCase()
                  .includes(state.search.trim().toLowerCase()) ||
                s.population
                  .toLowerCase()
                  .includes(state.search.trim().toLowerCase())),
          )
          .map((s) => [s.pcs[state.x], s.pcs[state.y]]),
      ).length > 0
    : false;
  return (
    <aside
      className="legend-dock"
      data-position={state.settings.legendPosition}
      style={
        { "--legend-cols": state.settings.legendColumns } as React.CSSProperties
      }
      aria-label="Population legend"
    >
      <div className="legend-header">
        <h2>
          Legend <span>{dataset.populations.length}</span>
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
        </div>
      </div>
      {searchOpen && (
        <div className="legend-search search-field">
          <Search size={13} />
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
            dispatch({ type: "allPopulations", names, patch: { hidden: true } })
          }
        >
          Hide all
        </button>
        {(hidden > 0 || hiddenOnly) && (
          <button
            className={`hidden-filter ${hiddenOnly ? "active" : ""}`}
            aria-pressed={hiddenOnly}
            onClick={() => setHiddenOnly(!hiddenOnly)}
          >
            <EyeOff size={11} />
            {hidden} hidden
          </button>
        )}
      </div>
      <div className="legend-list">
        {matches.slice(0, limit).map((pop) => {
          const custom = state.populations.get(pop.name) ?? {};
          return (
            <div
              className={`legend-row ${custom.hidden ? "is-hidden" : ""}`}
              data-population={pop.name}
              key={pop.name}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({
                  name: pop.name,
                  anchor: { x: e.clientX, y: e.clientY },
                });
              }}
            >
              <button
                className="legend-item"
                aria-label={`${custom.hidden ? "Show" : "Hide"} ${pop.name}`}
                title={`${pop.name} — right-click to edit`}
                onClick={() =>
                  dispatch({
                    type: "population",
                    name: pop.name,
                    patch: { hidden: !custom.hidden },
                  })
                }
              >
                <MarkerSwatch {...markerAppearance(pop, state)} />
                <span className="legend-name">{pop.name}</span>
                {custom.hull && (
                  <Pentagon size={11} className="hull-indicator" />
                )}
                {state.settings.legendCounts && (
                  <span className="legend-count">{pop.count}</span>
                )}
                {custom.hidden && (
                  <span className="hidden-label">
                    <EyeOff size={11} />
                    <span>Hidden</span>
                  </span>
                )}
              </button>
              <button
                className="icon-button legend-more"
                aria-label={`Edit ${pop.name}`}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setMenu({
                    name: pop.name,
                    anchor: { x: r.left - 230, y: r.bottom + 4 },
                  });
                }}
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          );
        })}
        {matches.length > limit && (
          <button
            className="text-button more-populations"
            onClick={() => setLimit(limit + 100)}
          >
            Show 100 more
          </button>
        )}
        {!matches.length && (
          <p className="legend-empty">
            {hiddenOnly
              ? "No hidden populations match."
              : "No populations match."}
          </p>
        )}
      </div>
      {menu && population && (
        <Popover
          title={population.name}
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
        >
          <PopulationEditor
            population={population}
            state={state}
            dispatch={dispatch}
            hullPossible={hullPossible}
          />
          <div className="popover-actions">
            <button
              onClick={() =>
                dispatch({
                  type: "population",
                  name: population.name,
                  patch: { hidden: !style.hidden },
                })
              }
            >
              {style.hidden ? <Eye size={14} /> : <EyeOff size={14} />}{" "}
              {style.hidden ? "Show population" : "Hide population"}
            </button>
            <button
              onClick={() => {
                dispatch({ type: "isolate", names, name: population.name });
                setMenu(null);
              }}
            >
              Show only this population
            </button>
            <button
              onClick={() =>
                dispatch({ type: "resetPopulation", name: population.name })
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
