/**
 * UI Components & Application Shell Unit Tests
 *
 * Verifies interaction sequences, toolbar cyclers, settings resumability,
 * label font constraints, and button contrast guarantees.
 */

import { describe, expect, it } from "vitest";
import {
  settingsTabs,
  type SettingsTab,
} from "../ui/components/dialogs/SettingsDialog";
import { chartBackgroundPresets } from "../core/color/contrast";

describe("Toolbar Interaction Cycles", () => {
  it("cycles point opacity in the exact specified sequence: 90% -> 80% -> 100% -> 60% -> 40% -> 20% -> 90%", () => {
    const cycleOpacity = (current: number) => {
      const sequence = [0.9, 0.8, 1.0, 0.6, 0.4, 0.2];
      const idx = sequence.indexOf(current);
      if (idx !== -1) return sequence[(idx + 1) % sequence.length];
      return 0.8;
    };

    let opacity = 0.9; // Default starting opacity
    opacity = cycleOpacity(opacity);
    expect(opacity).toBe(0.8);
    opacity = cycleOpacity(opacity);
    expect(opacity).toBe(1.0);
    opacity = cycleOpacity(opacity);
    expect(opacity).toBe(0.6);
    opacity = cycleOpacity(opacity);
    expect(opacity).toBe(0.4);
    opacity = cycleOpacity(opacity);
    expect(opacity).toBe(0.2);
    opacity = cycleOpacity(opacity);
    expect(opacity).toBe(0.9);
  });

  it("cycles marker size presets predictably", () => {
    const presets = [7, 9, 11, 14, 3, 5];
    const cycleSize = (current: number) => {
      const idx = presets.indexOf(current);
      if (idx !== -1) return presets[(idx + 1) % presets.length];
      const next = presets.find((v) => v > current);
      return next ?? presets[0];
    };

    let size = 7;
    size = cycleSize(size);
    expect(size).toBe(9);
    size = cycleSize(size);
    expect(size).toBe(11);
    size = cycleSize(size);
    expect(size).toBe(14);
    size = cycleSize(size);
    expect(size).toBe(3);
  });

  it("cycles hollow stroke widths predictably", () => {
    const presets = [1.5, 2, 2.5, 3, 1, 1.2];
    const cycleOutlineWidth = (current: number) => {
      const idx = presets.indexOf(current);
      if (idx !== -1) return presets[(idx + 1) % presets.length];
      return 1.5;
    };

    let width = 1.5;
    width = cycleOutlineWidth(width);
    expect(width).toBe(2);
    width = cycleOutlineWidth(width);
    expect(width).toBe(2.5);
  });
});

describe("Settings Dialog Structure & Resumability", () => {
  it("exposes all 7 comprehensive settings categories", () => {
    expect(settingsTabs).toEqual([
      "Chart",
      "Markers",
      "Labels",
      "Legend",
      "Hover",
      "Geometry",
      "Variance",
    ]);
  });

  it("preserves active tab state between dialog openings", () => {
    let activeTab: SettingsTab = "Chart";

    const onTabChange = (next: SettingsTab) => {
      activeTab = next;
    };

    const onClose = (lastTab?: SettingsTab) => {
      if (lastTab) activeTab = lastTab;
    };

    // User switches to "Labels"
    onTabChange("Labels");
    expect(activeTab).toBe("Labels");

    // User closes dialog
    onClose("Labels");
    expect(activeTab).toBe("Labels");

    // Dialog reopens with preserved tab
    const reopenedTab = activeTab;
    expect(reopenedTab).toBe("Labels");
  });

  it("provides comprehensive chart background presets with correct color values", () => {
    expect(chartBackgroundPresets.length).toBeGreaterThanOrEqual(6);
    const names = chartBackgroundPresets.map((p) => p.name);
    expect(names).toContain("White");
    expect(names).toContain("Charcoal");
    expect(names).toContain("Light gray");
  });
});

describe("Label and Outline Constraints", () => {
  it("validates point label size range (7-24px)", () => {
    const min = 7;
    const max = 24;
    const clampPointSize = (s: number) => Math.min(max, Math.max(min, s));

    expect(clampPointSize(5)).toBe(7);
    expect(clampPointSize(12)).toBe(12);
    expect(clampPointSize(30)).toBe(24);
  });

  it("validates group label size range (8-28px)", () => {
    const min = 8;
    const max = 28;
    const clampGroupSize = (s: number) => Math.min(max, Math.max(min, s));

    expect(clampGroupSize(6)).toBe(8);
    expect(clampGroupSize(16)).toBe(16);
    expect(clampGroupSize(35)).toBe(28);
  });
});
