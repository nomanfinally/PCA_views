// Palette families from the user's older smartPCA viewer.
export const paletteNames = [
  "classic",
  "pastel",
  "solid",
  "neon",
  "muted",
  "earth",
] as const;
export type PaletteName = (typeof paletteNames)[number];
const palettes: Record<PaletteName, string[]> = {
  classic: [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
  ],
  pastel: [
    "#8dd3c7",
    "#fb8072",
    "#80b1d3",
    "#bebada",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#bc80bd",
    "#a6cee3",
    "#ffed6f",
    "#b2df8a",
    "#cab2d6",
    "#ffb3ba",
    "#bae1ff",
    "#baffc9",
    "#ffdfba",
    "#a0c4ff",
    "#ffc6ff",
    "#caffbf",
    "#ffd6a5",
    "#bdb2ff",
    "#fdffb6",
    "#9bf6ff",
    "#e0bbe4",
    "#d291bc",
    "#fec8d8",
    "#d4a5a5",
    "#ccebc5",
    "#fbb4ae",
    "#fed9a6",
    "#d9f0a3",
  ],
  solid: [
    "#1f77b4",
    "#d62728",
    "#2ca02c",
    "#9467bd",
    "#ff7f0e",
    "#17becf",
    "#8c564b",
    "#e377c2",
    "#bcbd22",
    "#4d4d4d",
    "#0057e7",
    "#d11141",
    "#00a676",
    "#f37735",
    "#7b2cbf",
    "#00b4d8",
    "#6a994e",
    "#c1121f",
    "#f4a261",
    "#264653",
    "#ffbe0b",
    "#3a86ff",
    "#8338ec",
    "#fb5607",
    "#06d6a0",
    "#7209b7",
    "#118ab2",
    "#ef476f",
    "#073b4c",
    "#9b2226",
    "#ee9b00",
  ],
  neon: [
    "#ff006e",
    "#3a86ff",
    "#00f5d4",
    "#ffbe0b",
    "#8338ec",
    "#fb5607",
    "#06ffa5",
    "#ff00ff",
    "#00bbf9",
    "#fee440",
    "#ff5400",
    "#7fff00",
    "#00ffff",
    "#ff1493",
    "#9d4edd",
    "#00ff6a",
    "#ff2e63",
    "#08f7fe",
    "#f5d300",
    "#fe53bb",
    "#09fbd3",
    "#f15bb5",
    "#00f0ff",
    "#ccff00",
  ],
  muted: [
    "#4c78a8",
    "#f58518",
    "#54a24b",
    "#b279a2",
    "#72b7b2",
    "#e45756",
    "#8c6d31",
    "#9d755d",
    "#7f7f7f",
    "#6b6ecf",
    "#637939",
    "#8ca252",
    "#843c39",
    "#ad494a",
    "#5254a3",
    "#9c9ede",
    "#7b4173",
    "#a55194",
    "#3182bd",
    "#31a354",
    "#756bb1",
    "#636363",
  ],
  earth: [
    "#6b705c",
    "#a5a58d",
    "#cb997e",
    "#ddbea9",
    "#b7b7a4",
    "#936639",
    "#7f5539",
    "#386641",
    "#6a994e",
    "#bc6c25",
    "#dda15e",
    "#606c38",
    "#283618",
    "#8d99ae",
    "#9a8c98",
    "#4a4e69",
    "#8a817c",
    "#463f3a",
  ],
};

/** Blend toward white for lighter fills, or black for crisp outlines. */
export function shadeColor(color: string, amount: number): string {
  const hex = color.slice(1);
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const channels = [0, 2, 4].map((i) => parseInt(expanded.slice(i, i + 2), 16));
  return (
    "#" +
    channels
      .map((v) =>
        Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function fallbackColor(index: number): string {
  const hue = ((index * 137.508) % 360) / 30;
  const channel = (offset: number) => {
    const k = (offset + hue) % 12;
    return Math.round(
      255 * (0.52 - 0.55 * 0.48 * Math.max(-1, Math.min(k - 3, 9 - k, 1))),
    )
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
export function paletteColor(index: number, name: PaletteName): string {
  const base = palettes[name][index] ?? fallbackColor(index);
  return name === "classic" ? shadeColor(base, 0.3) : base;
}
export function populationColor(index: number): string {
  return paletteColor(index, "solid");
}

/** Chart fills are separate from the application's monochrome controls. */
export const chartBackgroundPresets = [
  { name: "White", color: "#ffffff" },
  { name: "Light gray", color: "#f1f2f3" },
  { name: "Ivory", color: "#faf5e9" },
  { name: "Ice blue", color: "#edf4fa" },
  { name: "Lavender", color: "#f3eff9" },
  { name: "Charcoal", color: "#252a31" },
] as const;
export function chartContrast(background: string) {
  const channels = [1, 3, 5].map(
    (i) => parseInt(background.slice(i, i + 2), 16) / 255,
  );
  const lightness =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const dark = lightness < 0.5;
  return {
    grid: shadeColor(background, dark ? 0.22 : -0.1),
    zero: shadeColor(background, dark ? 0.4 : -0.22),
    line: dark ? "#cdd3db" : "#444444",
  };
}
