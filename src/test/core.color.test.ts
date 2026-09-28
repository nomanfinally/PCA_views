import { describe, expect, it } from "vitest";
import { shadeColor, parseRgba, toRgbaString } from "../core/color/colorUtils";
import {
  paletteNames,
  paletteColor,
  populationColor,
  fallbackColor,
} from "../core/color/palettes";
import { chartContrast, getReadableTextColor } from "../core/color/contrast";

describe("core/color/colorUtils", () => {
  it("shades hex colors toward white or black", () => {
    expect(shadeColor("#000000", 0.5)).toBe("#808080");
    expect(shadeColor("#ffffff", -0.5)).toBe("#808080");
    expect(shadeColor("#f00", 0)).toBe("#ff0000");
  });

  it("parses hex and rgba strings reliably", () => {
    expect(parseRgba("#ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseRgba("rgba(10, 20, 30, 0.5)")).toEqual({
      r: 10,
      g: 20,
      b: 30,
      a: 0.5,
    });
  });

  it("formats rgba strings with scaled alpha", () => {
    expect(toRgbaString("#ff0000", 0.8)).toBe("rgba(255,0,0,0.8)");
  });
});

describe("core/color/palettes", () => {
  it("includes all standard palette presets", () => {
    expect(paletteNames).toContain("solid");
    expect(paletteNames).toContain("classic");
    expect(paletteNames).toContain("pastel");
  });

  it("provides deterministic fallback colors for large population counts", () => {
    const c1 = fallbackColor(100);
    const c2 = fallbackColor(100);
    expect(c1).toBe(c2);
    expect(c1).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("resolves default population color from solid palette", () => {
    expect(populationColor(0)).toBe("#1f77b4");
  });
});

describe("core/color/contrast", () => {
  it("derives appropriate contrast tones for light backgrounds", () => {
    const white = chartContrast("#ffffff");
    expect(white.isDark).toBe(false);
    expect(white.line).toBe("#444444");
    expect(getReadableTextColor("#ffffff")).toBe("#111827");
  });

  it("derives appropriate contrast tones for dark backgrounds", () => {
    const dark = chartContrast("#252a31");
    expect(dark.isDark).toBe(true);
    expect(dark.line).toBe("#cdd3db");
    expect(getReadableTextColor("#252a31")).toBe("#ffffff");
  });
});
