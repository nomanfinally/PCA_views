import { useId } from "react";
import type { MarkerSymbol } from "../domain/viewState";
import { MarkerSwatch } from "./MarkerSwatch";

/** Native radio controls keep the compact symbol palette keyboard accessible. */
export function MarkerShapePicker({
  label,
  title = "Marker shape",
  symbols,
  value,
  onChange,
  allowInherit = false,
}: {
  label: string;
  title?: string;
  symbols: readonly MarkerSymbol[];
  value?: MarkerSymbol;
  onChange: (symbol: MarkerSymbol | undefined) => void;
  allowInherit?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="marker-shape-picker" aria-label={label}>
      <legend>{title}</legend>
      {allowInherit && (
        <label className="marker-shape-inherit">
          <input
            type="radio"
            name={name}
            checked={value === undefined}
            onChange={() => onChange(undefined)}
          />
          Population default
        </label>
      )}
      <div className="marker-shape-grid">
        {symbols.map((symbol) => {
          const title = symbol.replaceAll("-", " ");
          return (
            <label className="marker-shape-option" key={symbol} title={title}>
              <input
                type="radio"
                name={name}
                aria-label={title}
                checked={value === symbol}
                onChange={() => onChange(symbol)}
              />
              <MarkerSwatch
                symbol={symbol}
                color="#777777"
                line={{ color: "#222222", width: 1 }}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
