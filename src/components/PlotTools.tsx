import type { SettingsTab } from "./SettingsDialog";
import {
  aspectRatios,
  groupLabelStyles,
  hullOpacityPresets,
} from "../domain/viewState";
import type { Dispatch, RefObject } from "react";
import {
  Camera,
  CircleDashed,
  CaseSensitive,
  Contrast,
  Eye,
  EyeOff,
  Grid2X2,
  MessageSquare,
  Pentagon,
  Ruler,
  Square,
  Tag,
  Tags,
  TrendingUp,
  Type,
  Blend,
  Crosshair,
  Focus,
  Hand,
  Home,
  Lasso,
  Maximize,
  Minimize,
  Minus,
  Plus,
  Scan,
  Settings2,
  SquareDashedMousePointer,
  Table2,
} from "lucide-react";
import type { ViewAction, ViewState } from "../domain/viewState";
import type { Dataset } from "../domain/types";
import type { PlotHandle } from "./PcaPlot";
import type { Anchor } from "./Popover";
export function PlotTools({
  dataset,
  state,
  dispatch,
  plot,
  onExport,
  onTable,
  fullscreen,
  onFullscreen,
  onSettings,
}: {
  dataset: Dataset;
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
  plot: RefObject<PlotHandle | null>;
  onExport: (anchor: Anchor) => void;
  onTable: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
  onSettings: (tab: SettingsTab, focusTitle?: boolean) => void;
}) {
  const names = dataset.populations.map((p) => p.name);
  const s = state.settings;
  const patch = (value: Partial<typeof s>) =>
    dispatch({ type: "settings", patch: value });
  const cycle = <T,>(values: readonly T[], current: T) =>
    values[(values.indexOf(current) + 1) % values.length];
  const all = (
    value: Parameters<typeof dispatch>[0] & { type: "allPopulations" },
  ) => dispatch(value);
  const cycleGroupLabels = () => {
    const next = cycle(
      ["off", ...groupLabelStyles] as const,
      s.groupLabels ? s.groupLabelStyle : "off",
    );
    patch({
      groupLabels: next !== "off",
      ...(next !== "off" ? { groupLabelStyle: next } : {}),
    });
    all({
      type: "allPopulations",
      names,
      patch: { label: undefined, labelStyle: undefined },
    });
  };
  const visible = names.some((n) => !state.populations.get(n)?.hidden);
  const hulls = names.some((n) => state.populations.get(n)?.hull),
    regression = names.some((n) => state.populations.get(n)?.regression);
  return (
    <div className="chart-tools" role="toolbar" aria-label="Plot tools">
      <div className="tool-group" role="group" aria-label="Interaction mode">
        {(
          [
            { value: "pan", label: "Pan mode", Icon: Hand },
            { value: "zoom", label: "Box zoom mode", Icon: Scan },
            {
              value: "select",
              label: "Box select mode",
              Icon: SquareDashedMousePointer,
            },
            { value: "lasso", label: "Lasso select mode", Icon: Lasso },
          ] as const
        ).map(({ value, label, Icon }) => (
          <button
            key={value}
            className={`icon-button ${state.mode === value ? "active" : ""}`}
            aria-label={label}
            title={label}
            aria-pressed={state.mode === value}
            onClick={() => dispatch({ type: "mode", value })}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="tool-group" role="group" aria-label="Zoom and fit">
        <button
          className="icon-button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => plot.current?.zoom(0.75)}
        >
          <Plus size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => plot.current?.zoom(1 / 0.75)}
        >
          <Minus size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Fit visible samples"
          title="Autoscale to visible samples"
          onClick={() => plot.current?.fit()}
        >
          <Focus size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Reset axes"
          title="Reset axes to all samples"
          onClick={() => plot.current?.reset()}
        >
          <Home size={16} />
        </button>
      </div>
      <div className="tool-group" role="group" aria-label="Markers">
        {[
          {
            label: `Cycle point opacity: ${Math.round(s.opacity * 100)}%`,
            Icon: Blend,
            run: () =>
              patch({ opacity: cycle([0.9, 0.8, 0.6, 0.4, 0.2, 0, 1], s.opacity) }),
          },
          {
            label: `Cycle boundary opacity: ${Math.round(s.outlineOpacity * 100)}%`,
            Icon: CircleDashed,
            run: () =>
              patch({
                outlineOpacity: cycle(
                  [1, 0.75, 0.5, 0.25, 0],
                  s.outlineOpacity,
                ),
              }),
          },
          {
            label: "Toggle grayscale",
            Icon: Contrast,
            active: s.grayscale,
            run: () => patch({ grayscale: !s.grayscale }),
          },
        ].map(({ label, Icon, active, run }) => (
          <button
            key={label.split(":")[0]}
            className={`icon-button ${active ? "active" : ""}`}
            aria-label={label}
            title={label}
            aria-pressed={active}
            onClick={run}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="tool-group" role="group" aria-label="Labels and geometry">
        {[
          {
            label: `Cycle point labels: ${s.labels}`,
            Icon: CaseSensitive,
            active: s.labels !== "none",
            run: () =>
              patch({
                labels: cycle(
                  ["none", "sample", "population", "full"] as const,
                  s.labels,
                ),
              }),
          },
          {
            label: `Cycle population labels: ${s.groupLabels ? s.groupLabelStyle : "off"}`,
            Icon: Tags,
            active: s.groupLabels,
            run: cycleGroupLabels,
          },
          {
            label: "Toggle label centroid connectors",
            Icon: Tag,
            active: s.groupLabelConnector,
            run: () => {
              patch({ groupLabelConnector: !s.groupLabelConnector });
              all({
                type: "allPopulations",
                names,
                patch: { labelConnector: undefined },
              });
            },
          },
          {
            label: `Cycle hulls: ${hulls ? `${Math.round(s.hullOpacity * 100)}%` : "off"}`,
            Icon: Pentagon,
            active: hulls,
            run: () => {
              const next = cycle(
                [0, ...hullOpacityPresets],
                hulls ? s.hullOpacity : 0,
              );
              if (next) patch({ hullOpacity: next });
              all({
                type: "allPopulations",
                names,
                patch: { hull: next !== 0, hullOpacity: undefined },
              });
            },
          },
          {
            label: "Toggle regression lines",
            Icon: TrendingUp,
            active: regression,
            run: () =>
              all({
                type: "allPopulations",
                names,
                patch: { regression: !regression },
              }),
          },
        ].map(({ label, Icon, active, run }) => (
          <button
            key={label.split(":")[0]}
            className={`icon-button ${active ? "active" : ""}`}
            aria-label={label}
            title={label}
            aria-pressed={active}
            onClick={run}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="tool-group" role="group" aria-label="View and hover">
        {[
          {
            label: "Crosshairs",
            Icon: Crosshair,
            active: s.spikes,
            run: () => patch({ spikes: !s.spikes }),
          },
          {
            label: "Show or hide all populations",
            Icon: visible ? Eye : EyeOff,
            active: !visible,
            run: () =>
              all({
                type: "allPopulations",
                names,
                patch: { hidden: visible },
              }),
          },
          {
            label: "Toggle hover information",
            Icon: MessageSquare,
            active: s.hover !== "off",
            run: () => patch({ hover: s.hover === "off" ? "closest" : "off" }),
          },

          {
            label: "Toggle grid",
            Icon: Grid2X2,
            active: s.grid,
            run: () => patch({ grid: !s.grid }),
          },
          {
            label: "Toggle equal axis scale",
            Icon: Ruler,
            active: s.equalScale,
            run: () => patch({ equalScale: !s.equalScale }),
          },
          {
            label: `Cycle chart ratio: ${s.aspectRatio}`,
            Icon: Square,
            active: s.aspectRatio !== "full",
            run: () =>
              patch({ aspectRatio: cycle(aspectRatios, s.aspectRatio) }),
          },
        ].map(({ label, Icon, active, run }) => (
          <button
            key={label.split(":")[0]}
            className={`icon-button ${active ? "active" : ""}`}
            aria-label={label}
            title={label}
            aria-pressed={active}
            onClick={run}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="tool-group" role="group" aria-label="Titles and settings">
        <button
          className="icon-button"
          aria-label="Edit plot title and subtitle"
          title="Edit plot title and subtitle"
          onClick={() => onSettings("Chart", true)}
        >
          <Type size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Plot settings"
          title="Plot settings"
          onClick={() => onSettings("Chart")}
        >
          <Settings2 size={16} />
        </button>
      </div>
      <div className="tool-group" role="group" aria-label="Data and export">
        <button
          className="icon-button"
          aria-label="Sample table"
          title="Open sample table"
          onClick={onTable}
        >
          <Table2 size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Export"
          title="Export image or data"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onExport({ x: r.right - 260, y: r.bottom + 8 });
          }}
        >
          <Camera size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={onFullscreen}
        >
          {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
    </div>
  );
}
