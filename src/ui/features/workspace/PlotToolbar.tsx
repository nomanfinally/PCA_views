import {
  Blend,
  CaseSensitive,
  CircleDashed,
  CircleDot,
  CircleX,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Focus,
  Grid2X2,
  Hand,
  Home,
  Lasso,
  Maximize,
  MessageSquare,
  Minimize,
  Minus,
  Pentagon,
  Plus,
  Ruler,
  Scan,
  Settings2,
  Square,
  SquareDashedMousePointer,
  Tags,
  TrendingUp,
  Type,
} from "lucide-react";
import React from "react";
import type { Dataset } from "../../../core/models/dataset";
import {
  aspectRatios,
  groupLabelStyles,
  hullOpacityPresets,
} from "../../../core/models/settings";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
import type { Anchor } from "../../primitives/Popover";
import type { PlotHandle } from "./PcaPlotCanvas";
import { HollowStrokeWidthIcon } from "./ToolbarIcons";

export interface PlotToolbarProps {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  plotRef: React.RefObject<PlotHandle | null>;
  onExport: (anchor: Anchor) => void;
  onTable: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
  onSettings: (tab?: string, focusTitle?: boolean) => void;
  activeSamplesCount?: number;
  totalSamplesCount?: number;
  excludedCount?: number;
}

export function PlotToolbar({
  dataset,
  state,
  dispatch,
  plotRef,
  fullscreen,
  onFullscreen,
  onSettings,
}: PlotToolbarProps) {
  const names = dataset.populations.map((p) => p.name);
  const s = state.settings;

  const patch = (settingsPatch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch: settingsPatch });

  const cycle = <T,>(values: readonly T[], current: T): T => {
    const idx = values.indexOf(current);
    if (idx === -1) return values[0];
    return values[(idx + 1) % values.length];
  };

  const cycleSize = (current: number) => {
    const presets = [7, 9, 11, 14, 3, 5];
    const idx = presets.indexOf(current);
    if (idx !== -1) return presets[(idx + 1) % presets.length];
    const next = presets.find((v) => v > current);
    return next ?? presets[0];
  };

  // Required cycle sequence: 80% -> 100% -> 60% -> 40% -> 20% -> 90% (default starts at 90%)
  const cycleOpacity = (current: number) => {
    const sequence = [0.9, 0.8, 1.0, 0.6, 0.4, 0.2];
    const idx = sequence.indexOf(current);
    if (idx !== -1) return sequence[(idx + 1) % sequence.length];
    return 0.8;
  };

  const cycleOutlineWidth = (current: number) => {
    const presets = [1.5, 2, 2.5, 3, 1, 1.2];
    const idx = presets.indexOf(current);
    if (idx !== -1) return presets[(idx + 1) % presets.length];
    return 1.5;
  };

  const cycleHullOpacity = (current: number) => {
    const sequence = [0, ...hullOpacityPresets];
    const idx = sequence.indexOf(current as any);
    if (idx !== -1) return sequence[(idx + 1) % sequence.length];
    const next = sequence.find((v) => v > current);
    return next ?? sequence[0];
  };

  const cycleGroupLabels = () => {
    const next = cycle(
      ["off", ...groupLabelStyles] as const,
      s.groupLabels ? s.groupLabelStyle : "off",
    );
    patch({
      groupLabels: next !== "off",
      ...(next !== "off" ? { groupLabelStyle: next } : {}),
    });
    dispatch({
      type: "allPopulations",
      names,
      patch: { label: undefined, labelStyle: undefined },
    });
  };

  const anyVisible = names.some((n) => !state.populations.get(n)?.hidden);
  const anyHulls = names.some((n) => state.populations.get(n)?.hull);
  const anyRegression = names.some((n) => state.populations.get(n)?.regression);
  const isHollow = s.markerPreset.startsWith("hollow");

  const markedCount = React.useMemo(() => {
    let count = 0;
    for (const style of state.points.values()) {
      if (style.marked) count++;
    }
    return count;
  }, [state.points]);
  const canClearMarks = markedCount > 0 || state.selected.size > 0;

  const toolsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const close = (event: PointerEvent) => {
      const details = toolsRef.current?.querySelector("details");
      if (details && !details.contains(event.target as Node))
        details.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const toolKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const controls = Array.from(
      toolsRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),summary",
      ) ?? [],
    ).filter((el) => el.getClientRects().length);
    const index = controls.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % controls.length
        : event.key === "ArrowLeft"
          ? (index - 1 + controls.length) % controls.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? controls.length - 1
              : -1;
    if (next >= 0) {
      event.preventDefault();
      controls.forEach(
        (control, i) => (control.tabIndex = i === next ? 0 : -1),
      );
      controls[next]?.focus();
    }
  };
  React.useEffect(() => {
    toolsRef.current
      ?.querySelectorAll<HTMLElement>("button:not(:disabled),summary")
      .forEach((control, i) => (control.tabIndex = i === 0 ? 0 : -1));
  }, []);
  return (
    <div
      className="plot-toolbar chart-tools"
      role="toolbar"
      aria-label="Plot tools"
      ref={toolsRef}
      onKeyDown={toolKeys}
    >
      <div
        className="tool-group"
        role="group"
        aria-label="Interaction mode and marks"
      >
        {(
          [
            { value: "pan", label: "Pan mode", text: "Pan", Icon: Hand },
            { value: "zoom", label: "Box zoom mode", text: "Zoom", Icon: Scan },
            {
              value: "select",
              label: "Box select mode",
              text: "Select",
              Icon: SquareDashedMousePointer,
            },
            {
              value: "lasso",
              label: "Lasso select mode",
              text: "Lasso",
              Icon: Lasso,
            },
          ] as const
        ).map(({ value, label, text, Icon }) => (
          <button
            key={value}
            className={`button ${state.mode === value ? "active" : ""}`}
            aria-label={label}
            title={label}
            aria-pressed={state.mode === value}
            onClick={() => dispatch({ type: "mode", value })}
          >
            <Icon size={16} />
            <span>{text}</span>
          </button>
        ))}
      </div>
      <div className="tool-group" role="group" aria-label="Zoom and fit">
        <button
          className="icon-button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => plotRef.current?.zoom(0.75)}
        >
          <Plus size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => plotRef.current?.zoom(1 / 0.75)}
        >
          <Minus size={17} />
        </button>
        <button
          className="button"
          aria-label="Fit visible samples"
          title="Fit visible samples"
          onClick={() => plotRef.current?.fit()}
        >
          <Focus size={16} />
          <span>Fit</span>
        </button>
        <button
          className="icon-button"
          aria-label="Reset axes"
          title="Reset axes"
          onClick={() => plotRef.current?.reset()}
        >
          <Home size={16} />
        </button>
      </div>
      <button
        className="icon-button"
        aria-label="Clear marks"
        title="Clear marks"
        disabled={!canClearMarks}
        onClick={() => dispatch({ type: "clearMarks" })}
      >
        <CircleX size={16} />
      </button>
      <details
        className="advanced-tools"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary className="button">
          <Settings2 size={16} />
          <span>Appearance</span>
        </summary>
        <div
          className="advanced-tool-panel"
          role="group"
          aria-label="Appearance tools"
        >
          {" "}
          {/* 3. Marker & appearance cyclers */}
          <div className="tool-group" role="group" aria-label="Markers">
            <button
              className="icon-button"
              aria-label={`Cycle point size: ${s.size}px`}
              title={`Cycle point size: ${s.size}px`}
              onClick={() => patch({ size: cycleSize(s.size) })}
            >
              <CircleDot size={16} />
              <span>{`Cycle point size: ${s.size}px`}</span>
            </button>
            {isHollow ? (
              <>
                <button
                  className="icon-button"
                  aria-label={`Cycle outline width: ${s.outlineWidth}px`}
                  title={`Cycle outline width: ${s.outlineWidth}px`}
                  onClick={() =>
                    patch({ outlineWidth: cycleOutlineWidth(s.outlineWidth) })
                  }
                >
                  <HollowStrokeWidthIcon size={16} />
                  <span>{`Cycle outline width: ${s.outlineWidth}px`}</span>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Cycle outline opacity: ${Math.round(s.outlineOpacity * 100)}%`}
                  title={`Cycle outline opacity: ${Math.round(s.outlineOpacity * 100)}%`}
                  onClick={() =>
                    patch({
                      outlineOpacity: cycle(
                        [1, 0.8, 0.6, 0.4, 0.2],
                        s.outlineOpacity,
                      ),
                    })
                  }
                >
                  <CircleDashed size={16} />
                  <span>{`Cycle outline opacity: ${Math.round(s.outlineOpacity * 100)}%`}</span>
                </button>
                <button
                  className={`icon-button ${s.grayscale ? "active" : ""}`}
                  aria-label="Toggle grayscale"
                  title="Toggle grayscale"
                  aria-pressed={s.grayscale}
                  onClick={() => patch({ grayscale: !s.grayscale })}
                >
                  <Contrast size={16} />
                  <span>Toggle grayscale</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="icon-button"
                  aria-label={`Cycle point opacity: ${Math.round(s.opacity * 100)}%`}
                  title={`Cycle point opacity: ${Math.round(s.opacity * 100)}%`}
                  onClick={() => patch({ opacity: cycleOpacity(s.opacity) })}
                >
                  <Blend size={16} />
                  <span>{`Cycle point opacity: ${Math.round(s.opacity * 100)}%`}</span>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Cycle boundary opacity: ${Math.round(s.outlineOpacity * 100)}%`}
                  title={`Cycle boundary opacity: ${Math.round(s.outlineOpacity * 100)}%`}
                  onClick={() =>
                    patch({
                      outlineOpacity: cycle(
                        [1, 0.75, 0.5, 0.25, 0],
                        s.outlineOpacity,
                      ),
                    })
                  }
                >
                  <CircleDashed size={16} />
                  <span>{`Cycle boundary opacity: ${Math.round(s.outlineOpacity * 100)}%`}</span>
                </button>
                <button
                  className={`icon-button ${s.grayscale ? "active" : ""}`}
                  aria-label="Toggle grayscale"
                  title="Toggle grayscale"
                  aria-pressed={s.grayscale}
                  onClick={() => patch({ grayscale: !s.grayscale })}
                >
                  <Contrast size={16} />
                  <span>Toggle grayscale</span>
                </button>
              </>
            )}
          </div>
          {/* 4. Labels & geometry */}
          <div
            className="tool-group"
            role="group"
            aria-label="Labels and geometry"
          >
            <button
              className={`icon-button ${s.labels !== "none" ? "active" : ""}`}
              aria-label={`Cycle point labels: ${s.labels}`}
              title={`Cycle point labels: ${s.labels}`}
              aria-pressed={s.labels !== "none"}
              onClick={() =>
                patch({
                  labels: cycle(
                    ["none", "sample", "population", "full"] as const,
                    s.labels,
                  ),
                })
              }
            >
              <CaseSensitive size={16} />
              <span>{`Cycle point labels: ${s.labels}`}</span>
            </button>
            <button
              className={`icon-button ${s.groupLabels ? "active" : ""}`}
              aria-label={`Cycle population labels: ${s.groupLabels ? s.groupLabelStyle : "off"}`}
              title={`Cycle population labels: ${s.groupLabels ? s.groupLabelStyle : "off"}`}
              aria-pressed={s.groupLabels}
              onClick={cycleGroupLabels}
            >
              <Tags size={16} />
              <span>{`Cycle population labels: ${s.groupLabels ? s.groupLabelStyle : "off"}`}</span>
            </button>

            <button
              className={`icon-button ${anyHulls ? "active" : ""}`}
              aria-label={`Cycle hulls: ${anyHulls ? `${Math.round(s.hullOpacity * 100)}%` : "off"}`}
              title={`Cycle hulls: ${anyHulls ? `${Math.round(s.hullOpacity * 100)}%` : "off"}`}
              aria-pressed={anyHulls}
              onClick={() => {
                const next = cycleHullOpacity(anyHulls ? s.hullOpacity : 0);
                if (next) patch({ hullOpacity: next });
                dispatch({
                  type: "allPopulations",
                  names,
                  patch: { hull: next !== 0, hullOpacity: undefined },
                });
              }}
            >
              <Pentagon size={16} />
            </button>
            <button
              className={`icon-button ${anyRegression ? "active" : ""}`}
              aria-label="Toggle regression lines"
              title="Toggle regression lines"
              aria-pressed={anyRegression}
              onClick={() =>
                dispatch({
                  type: "allPopulations",
                  names,
                  patch: { regression: !anyRegression },
                })
              }
            >
              <TrendingUp size={16} />
              <span>Toggle regression lines</span>
            </button>
          </div>
          {/* 5. View, hover & scale */}
          <div className="tool-group" role="group" aria-label="View and hover">
            <button
              className={`icon-button ${s.spikes ? "active" : ""}`}
              aria-label="Crosshairs"
              title="Crosshairs"
              aria-pressed={s.spikes}
              onClick={() => patch({ spikes: !s.spikes })}
            >
              <Crosshair size={16} />
              <span>Crosshairs</span>
            </button>
            <button
              className={`icon-button ${!anyVisible ? "active" : ""}`}
              aria-label="Show or hide all populations"
              title="Show or hide all populations"
              aria-pressed={!anyVisible}
              onClick={() =>
                dispatch({
                  type: "allPopulations",
                  names,
                  patch: { hidden: anyVisible },
                })
              }
            >
              {anyVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>Show or hide all populations</span>
            </button>
            <button
              className={`icon-button ${s.hover !== "off" ? "active" : ""}`}
              aria-label="Toggle hover information"
              title="Toggle hover information"
              aria-pressed={s.hover !== "off"}
              onClick={() =>
                patch({ hover: s.hover === "off" ? "closest" : "off" })
              }
            >
              <MessageSquare size={16} />
              <span>Toggle hover information</span>
            </button>
            <button
              className="icon-button"
              aria-label="Toggle grid"
              title="Toggle grid"
              aria-pressed={s.grid}
              onClick={() => patch({ grid: !s.grid })}
            >
              <Grid2X2 size={16} />
              <span>Toggle grid</span>
            </button>
            <button
              className={`icon-button ${s.equalScale ? "active" : ""}`}
              aria-label="Toggle equal axis scale"
              title="Toggle equal axis scale"
              aria-pressed={s.equalScale}
              onClick={() => patch({ equalScale: !s.equalScale })}
            >
              <Ruler size={16} />
              <span>Toggle equal axis scale</span>
            </button>
            <button
              className={`icon-button ${s.aspectRatio !== "full" ? "active" : ""}`}
              aria-label={`Cycle chart ratio: ${s.aspectRatio}`}
              title={`Cycle chart ratio: ${s.aspectRatio}`}
              aria-pressed={s.aspectRatio !== "full"}
              onClick={() =>
                patch({ aspectRatio: cycle(aspectRatios, s.aspectRatio) })
              }
            >
              <Square size={16} />
              <span>{`Cycle chart ratio: ${s.aspectRatio}`}</span>
            </button>
          </div>
          <button
            className="button"
            aria-label="Edit plot title and subtitle"
            onClick={() => onSettings("Chart", true)}
          >
            <Type size={16} />
            <span>Edit title and subtitle</span>
          </button>
          <button
            className="button mobile-control"
            aria-label="Reset all axis ranges"
            onClick={() => plotRef.current?.reset()}
          >
            <Home size={16} />
            <span>Reset axis ranges</span>
          </button>
          <button
            className="button mobile-control"
            aria-label="Clear all marks"
            disabled={!canClearMarks}
            onClick={() => dispatch({ type: "clearMarks" })}
          >
            <CircleX size={16} />
            <span>Clear marks</span>
          </button>
        </div>
      </details>
      <button
        className="icon-button fullscreen-control"
        aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        title="Fullscreen"
        onClick={onFullscreen}
      >
        {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
      <span className="plot-toolbar-hint">
        Click a sample to mark · Right-click to inspect
      </span>
    </div>
  );
}
