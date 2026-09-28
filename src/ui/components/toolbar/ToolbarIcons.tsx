import React from "react";

export interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Custom SVG icon representing a group label callout box connected
 * by a leader line to the population centroid marker.
 */
export function LabelCentroidConnectorIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Label callout badge */}
      <rect x="2.5" y="3" width="12" height="8" rx="2" />
      <line x1="5.5" y1="7" x2="11.5" y2="7" strokeWidth="1.5" />
      {/* Connector leader line */}
      <line x1="11" y1="11" x2="16.5" y2="16.5" />
      {/* Centroid marker dot */}
      <circle cx="18.5" cy="18.5" r="2.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Custom SVG icon representing a hollow ring marker with graduated
 * stroke width thickness adjustment lines.
 */
export function HollowStrokeWidthIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Hollow circle marker */}
      <circle cx="7.5" cy="12" r="5" stroke="currentColor" strokeWidth="2.2" />
      {/* Graduated stroke width thickness indicator lines */}
      <line x1="15" y1="7" x2="21.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
      <line x1="15" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="2.4" />
      <line x1="15" y1="17" x2="21.5" y2="17" stroke="currentColor" strokeWidth="3.8" />
    </svg>
  );
}
