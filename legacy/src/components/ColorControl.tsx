import { paletteColor } from "../domain/colors";
const swatches = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
  .map((index) => paletteColor(index, "classic"))
  .concat(["#000000", "#d13e42"]);
export function ColorControl({
  color,
  onChange,
  label = "Color",
}: {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  return (
    <div className="color-control">
      <label>
        {label}
        <input
          aria-label={label}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className="swatches">
        {swatches.map((value) => (
          <button
            key={value}
            aria-label={`Use ${value}`}
            aria-pressed={color === value}
            style={{ background: value }}
            onClick={() => onChange(value)}
          />
        ))}
      </div>
    </div>
  );
}
