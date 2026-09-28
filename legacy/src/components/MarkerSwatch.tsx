import type { MarkerSymbol } from "../domain/viewState";
/** Small vector swatches share the chart's fill/outline treatment. */
export function MarkerSwatch({
  symbol,
  color,
  line,
  fillOpacity = 1,
  outlineOpacity = 1,
}: {
  symbol: MarkerSymbol;
  color: string;
  line: { color: string; width: number };
  fillOpacity?: number;
  outlineOpacity?: number;
}) {
  const base = symbol.replace(/-open$/, "");
  const polygon = (n: number, angle = -Math.PI / 2) =>
    Array.from(
      { length: n },
      (_, i) =>
        `${8 * Math.cos(angle + (i * 2 * Math.PI) / n)},${8 * Math.sin(angle + (i * 2 * Math.PI) / n)}`,
    ).join(" ");
  const shape =
    base === "circle" ? (
      <circle r="7" />
    ) : base === "square" ? (
      <rect x="-6" y="-6" width="12" height="12" />
    ) : base === "cross" ? (
      <path d="M-2-8H2V-2H8V2H2V8H-2V2H-8V-2H-2Z" />
    ) : base === "x" ? (
      <path d="M-6-8L0-2L6-8L8-6L2 0L8 6L6 8L0 2L-6 8L-8 6L-2 0L-8-6Z" />
    ) : base === "star" ? (
      <polygon
        points={Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5,
            r = i % 2 ? 3.6 : 9;
          return `${r * Math.cos(a)},${r * Math.sin(a)}`;
        }).join(" ")}
      />
    ) : (
      <polygon
        points={polygon(
          base.startsWith("triangle")
            ? 3
            : base === "diamond"
              ? 4
              : base === "pentagon"
                ? 5
                : base === "hexagon"
                  ? 6
                  : 8,
          base === "triangle-down"
            ? Math.PI / 2
            : base === "triangle-left"
              ? Math.PI
              : base === "triangle-right"
                ? 0
                : -Math.PI / 2,
        )}
      />
    );
  return (
    <svg
      className="marker-swatch"
      width="14"
      height="14"
      viewBox="-11 -11 22 22"
      aria-hidden="true"
      fill={symbol.endsWith("-open") ? "none" : color}
      fillOpacity={fillOpacity}
      strokeOpacity={outlineOpacity}
      stroke={line.color}
      strokeWidth={Math.max(line.width, 0.6) * 1.6}
      strokeLinejoin="round"
    >
      {shape}
    </svg>
  );
}
