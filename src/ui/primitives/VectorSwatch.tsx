/**
 * Vector Marker Swatch Component
 * 
 * Crisp SVG preview of marker symbols, fills, and outline widths for legend rows and pickers.
 */

import React from "react";
import type { MarkerSymbol } from "../../core/models/settings";
import { isHollowSymbol, toSolidSymbol } from "../../core/style/symbols";

export interface VectorSwatchProps {
  symbol: MarkerSymbol;
  color?: string;
  lineColor?: string;
  lineWidth?: number;
  fillOpacity?: number;
  outlineOpacity?: number;
  size?: number;
  className?: string;
}

export function VectorSwatch({
  symbol,
  color = "#4b5563",
  lineColor = "#111827",
  lineWidth = 1,
  fillOpacity = 1,
  outlineOpacity = 1,
  size = 14,
  className = "",
}: VectorSwatchProps) {
  const isHollow = isHollowSymbol(symbol);
  const base = toSolidSymbol(symbol);

  const getPoints = (sides: number, startAngle = -Math.PI / 2, r = 8) =>
    Array.from({ length: sides }, (_, i) => {
      const angle = startAngle + (i * 2 * Math.PI) / sides;
      return `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`;
    }).join(" ");

  const renderShape = () => {
    switch (base) {
      case "circle":
        return <circle r="7" />;
      case "square":
        return <rect x="-6" y="-6" width="12" height="12" />;
      case "diamond":
        return <polygon points="0,-8 8,0 0,8 -8,0" />;
      case "triangle-up":
        return <polygon points={getPoints(3, -Math.PI / 2)} />;
      case "triangle-down":
        return <polygon points={getPoints(3, Math.PI / 2)} />;
      case "triangle-left":
        return <polygon points={getPoints(3, Math.PI)} />;
      case "triangle-right":
        return <polygon points={getPoints(3, 0)} />;
      case "pentagon":
        return <polygon points={getPoints(5, -Math.PI / 2)} />;
      case "hexagon":
        return <polygon points={getPoints(6, -Math.PI / 2)} />;
      case "octagon":
        return <polygon points={getPoints(8, -Math.PI / 2)} />;
      case "cross":
        return <path d="M-2-8H2V-2H8V2H2V8H-2V2H-8V-2H-2Z" />;
      case "x":
        return <path d="M-6-8L0-2L6-8L8-6L2 0L8 6L6 8L0 2L-6 8L-8 6L-2 0L-8-6Z" />;
      case "star":
        return (
          <polygon
            points={Array.from({ length: 10 }, (_, i) => {
              const a = -Math.PI / 2 + (i * Math.PI) / 5;
              const r = i % 2 ? 3.6 : 9;
              return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
            }).join(" ")}
          />
        );
      default:
        return <circle r="7" />;
    }
  };

  return (
    <svg
      className={`vector-swatch ${className}`.trim()}
      width={size}
      height={size}
      viewBox="-11 -11 22 22"
      aria-hidden="true"
      fill={isHollow ? "none" : color}
      fillOpacity={isHollow ? 0 : fillOpacity}
      stroke={lineColor}
      strokeOpacity={outlineOpacity}
      strokeWidth={Math.max(lineWidth, 0.6) * 1.6}
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {renderShape()}
    </svg>
  );
}
