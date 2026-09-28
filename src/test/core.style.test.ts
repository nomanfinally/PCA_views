import { describe, expect, it } from "vitest";
import { defaultSettings } from "../core/models/settings";
import type { Population } from "../core/models/dataset";
import {
  isHollowSymbol,
  toSolidSymbol,
  toHollowSymbol,
  applyTreatmentToSymbol,
  getPresetSymbol,
} from "../core/style/symbols";
import {
  resolveMarkerStyle,
  toRenderedMarker,
} from "../core/style/styleResolver";

const testPopulation: Population = {
  name: "CEU",
  count: 100,
  color: "#1f77b4",
};

describe("core/style/symbols", () => {
  it("detects and transforms solid and hollow symbols", () => {
    expect(isHollowSymbol("circle-open")).toBe(true);
    expect(isHollowSymbol("circle")).toBe(false);
    expect(toSolidSymbol("diamond-open")).toBe("diamond");
    expect(toHollowSymbol("diamond")).toBe("diamond-open");
    expect(toHollowSymbol("diamond-open")).toBe("diamond-open");
  });

  it("applies treatments correctly across index positions", () => {
    expect(applyTreatmentToSymbol("circle", "hollow")).toBe("circle-open");
    expect(applyTreatmentToSymbol("circle-open", "filled")).toBe("circle");
    expect(applyTreatmentToSymbol("circle", "mixed", 0)).toBe("circle");
    expect(applyTreatmentToSymbol("circle", "mixed", 1)).toBe("circle-open");
    expect(applyTreatmentToSymbol("circle", "inherit", 0, true)).toBe("circle-open");
  });

  it("resolves preset symbols with cyclic shape rotation", () => {
    expect(getPresetSymbol("circles", 0)).toBe("circle");
    expect(getPresetSymbol("hollow-circles", 0)).toBe("circle-open");
    expect(getPresetSymbol("shapes", 0)).toBe("circle");
    expect(getPresetSymbol("shapes", 1)).toBe("square");
    expect(getPresetSymbol("hollow-shapes", 1)).toBe("square-open");
  });
});

describe("core/style/styleResolver", () => {
  it("resolves default global styling when no overrides are provided", () => {
    const style = resolveMarkerStyle({
      population: testPopulation,
      settings: defaultSettings,
    });
    expect(style.color).toBe("#1f77b4");
    expect(style.symbol).toBe("circle");
    expect(style.size).toBe(defaultSettings.size);
    expect(style.fillOpacity).toBe(defaultSettings.opacity);
    expect(style.isHollow).toBe(false);
  });

  it("applies population-level overrides over global settings", () => {
    const style = resolveMarkerStyle({
      population: testPopulation,
      settings: defaultSettings,
      populationOverride: {
        color: "#ff0000",
        size: 14,
        markerPreset: "hollow-shapes",
      },
      sampleIndex: 1, // square-open
    });
    expect(style.color).toBe("#ff0000");
    expect(style.size).toBe(14);
    expect(style.symbol).toBe("square-open");
    expect(style.isHollow).toBe(true);
  });

  it("applies sample-level overrides over population-level overrides", () => {
    const style = resolveMarkerStyle({
      population: testPopulation,
      settings: defaultSettings,
      populationOverride: {
        color: "#ff0000",
        size: 14,
        symbol: "square",
      },
      sampleOverride: {
        color: "#00ff00",
        size: 20,
        symbol: "star",
        markerTreatment: "hollow",
      },
    });
    expect(style.color).toBe("#00ff00");
    expect(style.size).toBe(20);
    expect(style.symbol).toBe("star-open");
    expect(style.isHollow).toBe(true);
  });

  it("correctly evaluates outline modes (matching, darker, black)", () => {
    const matching = resolveMarkerStyle({
      population: testPopulation,
      settings: { ...defaultSettings, outlineMode: "matching" },
    });
    expect(matching.line.color).toBe(testPopulation.color);

    const black = resolveMarkerStyle({
      population: testPopulation,
      settings: { ...defaultSettings, outlineMode: "black" },
    });
    expect(black.line.color).toBe("#000000");

    const darker = resolveMarkerStyle({
      population: testPopulation,
      settings: { ...defaultSettings, outlineMode: "darker" },
    });
    expect(darker.line.color).not.toBe(testPopulation.color);
    expect(darker.line.color.startsWith("#")).toBe(true);
  });

  it("transforms resolved marker to renderer-safe format", () => {
    const hollowStyle = resolveMarkerStyle({
      population: testPopulation,
      settings: defaultSettings,
      sampleOverride: {
        symbol: "diamond-open",
        outlineColor: "#ff0000",
        outlineOpacity: 0.8,
      },
    });
    const rendered = toRenderedMarker(hollowStyle);
    expect(rendered.color).toBe("rgba(0,0,0,0)"); // transparent fill
    expect(rendered.symbol).toBe("diamond"); // solid symbol name for renderer
    expect(rendered.line.color).toBe("rgba(255,0,0,0.8)"); // alpha-blended outline
  });
});
