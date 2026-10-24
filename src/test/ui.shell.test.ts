import { expect, it } from "vitest";
import { chartBackgroundPresets } from "../core/color/contrast";
import { settingsTabs } from "../ui/features/settings/SettingsDialog";
it("exposes the seven settings sections used by the workspace", () => {
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
it("provides named scientific chart background presets", () => {
  expect(chartBackgroundPresets.map((p) => p.name)).toEqual(
    expect.arrayContaining(["White", "Charcoal", "Light gray"]),
  );
});
