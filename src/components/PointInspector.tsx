import { Slider } from "./StyleControls";
import type { Dispatch } from "react";
import { Circle, X } from "lucide-react";
import type { Dataset } from "../domain/types";
import type { ViewAction, ViewState, SampleStyle } from "../domain/viewState";
import {
  groupLabelStyles,
  cycleValue,
  markerAppearance,
  markerSymbols,
  type MarkerSymbol,
} from "../domain/viewState";
import { Popover, type Anchor } from "./Popover";
import { ColorControl } from "./ColorControl";
import { MarkerShapePicker } from "./MarkerShapePicker";
export function PointInspector({
  dataset,
  state,
  dispatch,
  anchor,
  onClose,
}: {
  dataset: Dataset;
  state: ViewState;
  dispatch: Dispatch<ViewAction>;
  anchor?: Anchor | null;
  onClose?: () => void;
}) {
  if (state.inspector === null) return null;
  const sample = dataset.samples[state.inspector],
    custom = state.points.get(sample.key) ?? {};
  const population = dataset.populations.find(
    (p) => p.name === sample.population,
  )!;
  const inherited =
    state.populations.get(sample.population)?.color ?? population.color;
  const groupStyle = state.populations.get(sample.population);
  const ordinal = dataset.samples
    .filter((s) => s.population === sample.population)
    .findIndex((s) => s.key === sample.key);
  const appearance = markerAppearance(population, state, custom, ordinal);
  const markerStyle =
    custom.markerTreatment ??
    (custom.symbol
      ? custom.symbol.endsWith("-open")
        ? "hollow"
        : "filled"
      : "inherit");
  const patch = (value: Partial<SampleStyle>) =>
    dispatch({ type: "point", key: sample.key, patch: value });
  const close = onClose ?? (() => dispatch({ type: "inspect", key: null }));
  const contents = (
    <>
      {!anchor && (
        <div className="popover-header">
          <div>
            <span className="eyebrow">SAMPLE</span>
            <strong>{sample.id}</strong>
          </div>
          <button
            className="icon-button"
            aria-label="Close sample details"
            onClick={close}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <p className="point-population">{sample.population}</p>
      <div className="point-coordinates">
        <span>
          PC{state.x + 1}
          <strong>{sample.pcs[state.x]}</strong>
        </span>
        <span>
          PC{state.y + 1}
          <strong>{sample.pcs[state.y]}</strong>
        </span>
      </div>
      <label className="control-row mark-control">
        <span>
          <Circle size={13} />
          Red boundary
        </span>
        <input
          aria-label="Red boundary"
          type="checkbox"
          checked={!!custom.marked}
          onChange={(e) =>
            dispatch({
              type: "point",
              key: sample.key,
              patch: { marked: e.target.checked },
            })
          }
        />
      </label>
      <label className="control-row">
        Marker style
        <select
          aria-label="Sample marker style"
          value={markerStyle}
          onChange={(e) =>
            patch({
              markerTreatment: e.target.value as SampleStyle["markerTreatment"],
            })
          }
        >
          <option value="inherit">Population default</option>
          <option value="filled">Filled</option>
          <option value="hollow">Hollow</option>
        </select>
      </label>
      <MarkerShapePicker
        label="Sample shape"
        symbols={markerSymbols.filter((symbol) => !symbol.endsWith("-open"))}
        value={custom.symbol?.replace(/-open$/, "") as MarkerSymbol | undefined}
        allowInherit
        onChange={(symbol) => patch({ symbol, markerTreatment: markerStyle })}
      />
      <label className="control-row">
        Size
        <div className="range-value">
          <input
            aria-label="Sample size"
            type="range"
            min="3"
            max="24"
            step="1"
            value={appearance.size}
            onChange={(e) =>
              dispatch({
                type: "point",
                key: sample.key,
                patch: { size: Number(e.target.value) },
              })
            }
          />
          <output>{appearance.size}px</output>
        </div>
      </label>
      <ColorControl
        label="Sample color"
        color={custom.color ?? inherited}
        onChange={(color) =>
          dispatch({ type: "point", key: sample.key, patch: { color } })
        }
      />
      <label className="control-row">
        Outline
        <select
          aria-label="Sample outline"
          value={
            custom.outlineColor ? "custom" : (custom.outlineMode ?? "inherit")
          }
          onChange={(e) =>
            dispatch({
              type: "point",
              key: sample.key,
              patch: {
                outlineColor:
                  e.target.value === "custom"
                    ? appearance.line.color
                    : undefined,
                outlineMode:
                  e.target.value === "darker" || e.target.value === "black"
                    ? e.target.value
                    : undefined,
              },
            })
          }
        >
          <option value="inherit">Population default</option>
          <option value="darker">Darker than fill</option>
          <option value="black">Black</option>
          <option value="custom">Custom color</option>
        </select>
      </label>
      {custom.outlineColor && (
        <ColorControl
          label="Sample outline color"
          color={custom.outlineColor}
          onChange={(outlineColor) =>
            dispatch({
              type: "point",
              key: sample.key,
              patch: { outlineColor },
            })
          }
        />
      )}
      <label className="control-row">
        Show IID label
        <input
          aria-label="Show IID label"
          type="checkbox"
          checked={!!custom.label}
          onChange={(e) => patch({ label: e.target.checked })}
        />
      </label>
      <details className="sample-opacity">
        <summary>Label style &amp; text</summary>
        <label className="control-row">
          Connect label to sample
          <input
            type="checkbox"
            checked={
              custom.labelConnector ??
              groupStyle?.labelConnector ??
              state.settings.groupLabelConnector
            }
            onChange={(e) => patch({ labelConnector: e.target.checked })}
          />
        </label>
        <label className="control-row">
          Label style
          <select
            aria-label="Sample label style"
            value={custom.labelStyle ?? "inherit"}
            onChange={(e) =>
              patch({
                labelStyle:
                  e.target.value === "inherit"
                    ? undefined
                    : (e.target.value as SampleStyle["labelStyle"]),
              })
            }
          >
            <option value="inherit">Population default</option>
            {groupLabelStyles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </label>
        <button
          className="text-button"
          onClick={() =>
            patch({
              label: true,
              labelStyle: cycleValue(
                groupLabelStyles,
                custom.labelStyle ??
                  groupStyle?.labelStyle ??
                  state.settings.groupLabelStyle,
              ),
            })
          }
        >
          Cycle sample label style
        </button>
        <Slider
          label="Sample label size"
          min={8}
          max={24}
          step={1}
          value={custom.labelSize ?? groupStyle?.labelSize ?? 11}
          onChange={(labelSize) => patch({ labelSize })}
        />
        <Slider
          label="Sample label opacity"
          value={custom.labelOpacity ?? groupStyle?.labelOpacity ?? 1}
          percent
          onChange={(labelOpacity) => patch({ labelOpacity })}
        />
        <ColorControl
          label="Sample label color"
          color={
            custom.labelColor ?? groupStyle?.labelColor ?? appearance.color
          }
          onChange={(labelColor) => patch({ labelColor })}
        />
        <label className="control-row">
          Point text
          <select
            aria-label="Sample point labels"
            value={custom.pointLabels ?? "inherit"}
            onChange={(e) =>
              patch({
                pointLabels:
                  e.target.value === "inherit"
                    ? undefined
                    : (e.target.value as SampleStyle["pointLabels"]),
              })
            }
          >
            <option value="inherit">Population default</option>
            <option value="none">None</option>
            <option value="sample">IID</option>
            <option value="population">FID</option>
            <option value="full">FID + IID</option>
          </select>
        </label>
      </details>
      <details className="sample-opacity">
        <summary>Fill &amp; boundary transparency</summary>
        <Slider
          label="Sample boundary width"
          min={0.2}
          max={3}
          step={0.1}
          value={appearance.line.width}
          onChange={(outlineWidth) => patch({ outlineWidth })}
        />
        <Slider
          label="Sample fill opacity"
          value={appearance.fillOpacity}
          percent
          onChange={(opacity) =>
            dispatch({ type: "point", key: sample.key, patch: { opacity } })
          }
        />
        <Slider
          label="Sample boundary opacity"
          value={appearance.outlineOpacity}
          percent
          onChange={(outlineOpacity) =>
            dispatch({
              type: "point",
              key: sample.key,
              patch: { outlineOpacity },
            })
          }
        />
      </details>
      <button
        className="text-button reset-point"
        onClick={() =>
          dispatch({
            type: "resetPoint",
            key: sample.key,
          })
        }
      >
        Reset this sample
      </button>
    </>
  );
  return anchor ? (
    <Popover
      title={`Edit sample: ${sample.id}`}
      anchor={anchor}
      onClose={close}
    >
      <div className="popover-body sample-editor">{contents}</div>
    </Popover>
  ) : (
    <section className="point-inspector" aria-label="Sample details">
      {contents}
    </section>
  );
}
