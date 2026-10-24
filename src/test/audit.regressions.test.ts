import { describe, expect, it } from "vitest";
import { parseEvec } from "../core/parsers/parseEvec";
import { formatAxisTitle, parseSpectrum } from "../core/parsers/parseSpectrum";
import { initialView } from "../state/viewState";
import { selectAxisVariance } from "../state/viewSelectors";
import { samplesToEvec } from "../services/export/csvExport";
import {
  restoreArchiveState,
  serializeArchive,
} from "../services/export/archiveService";
import { buildPlotSpec } from "../plot/spec/buildPlotSpec";
import { mapSpecToPlotly } from "../plot/adapters/plotly/plotlyMapper";

const dataset = parseEvec(
  "#eigvals: 0.0000000123456789 0.0000000056789123\nS1 0.0000000123456789 -0.12345678901234567 POP_A\nS2 0.2 0.3 POP_A",
  "precision.evec",
);

describe("audit: scientific data integrity", () => {
  it("matches small eigenvalues with relative tolerance rather than an absolute .005 window", () => {
    const small = parseEvec("#eigvals: .001 .0005\na 0 1 A", "small.evec");
    expect(() => parseSpectrum(".005 .0005", small)).toThrow(/do not match/);
    expect(parseSpectrum(".001004 .000502 1e-5", small)).toEqual([
      0.001004, 0.000502, 1e-5,
    ]);
  });

  it("rejects non-scientific numeric syntax in spectrum files", () => {
    const data = parseEvec("a 0 1 A", "no-header.evec");
    expect(() => parseSpectrum("0x10 0x08", data)).toThrow(
      /nonnegative eigenvalue/,
    );
  });
  it("round-trips every coordinate and eigenvalue without rounding", () => {
    const restored = parseEvec(
      samplesToEvec(dataset.samples, dataset.eigenvalues),
      "copy.evec",
    );
    expect(restored.samples).toEqual(dataset.samples);
    expect(restored.eigenvalues).toEqual(dataset.eigenvalues);
  });

  it("rejects group IDs that cannot be represented by the evec format", () => {
    expect(() =>
      samplesToEvec(dataset.samples, dataset.eigenvalues, {
        samplePopulations: new Map([[0, "two groups"]]),
      }),
    ).toThrow(/whitespace/i);
  });

  it.each([0, -1, 1e-10, Infinity, NaN])(
    "uses consistent variance validation for total %s",
    (total) => {
      const state = initialView(dataset);
      state.settings.varianceTotal = total;
      expect(formatAxisTitle(dataset, state.settings, [], 0)).toBe("PC1");
      expect(selectAxisVariance(dataset, state, 0)).toBeNull();
    },
  );

  it("omits percentages for a missing eigenvalue or overflowed spectrum", () => {
    const state = initialView(dataset);
    expect(formatAxisTitle(dataset, state.settings, [], 99)).toBe("PC100");
    const overflow = { ...dataset, eigenvalues: [1e308, 1e308] };
    expect(formatAxisTitle(overflow, state.settings, [], 0)).toBe("PC1");
    expect(selectAxisVariance(overflow, state, 0)).toBeNull();
  });
});

describe("audit: live renderer mapping", () => {
  it("renders literal titles and identifiers, and resolves label fonts independently of markers", () => {
    const data = parseEvec(
      "<b>S1</b> 0 1 <b>POP</b>\nS2 1 0 <b>POP</b>",
      "literal.evec",
    );
    const state = initialView(data);
    state.settings = {
      ...state.settings,
      title: "Study <2026>",
      subtitle: "A & B",
      labels: "sample",
      pointLabelSize: 16,
      groupLabels: true,
    };
    state.points.set(0, {
      size: 22,
      pointLabelSize: 19,
      markerTreatment: "hollow",
    });
    const bundle = mapSpecToPlotly(buildPlotSpec(data, data.samples, state));
    const trace = bundle.data[0] as any;
    expect(bundle.layout.title?.text).toContain("Study &lt;2026&gt;");
    expect(bundle.layout.title?.text).toContain("A &amp; B");
    expect(bundle.layout.annotations?.[0].text).toBe("&lt;b&gt;POP&lt;/b&gt;");
    expect(trace.text[0]).toBe("&lt;b&gt;S1&lt;/b&gt;");
    expect(trace.textfont.size).toEqual([19, 16]);
    expect(trace.textfont.color[0]).not.toBe("rgba(0,0,0,0)");
  });

  it("keeps axis identity stable when variance formatting changes", () => {
    const state = initialView(dataset);
    const before = buildPlotSpec(dataset, dataset.samples, state);
    state.settings = { ...state.settings, showVariance: false };
    const after = buildPlotSpec(dataset, dataset.samples, state);
    expect(before.layout.axesKey).toBe("0:1");
    expect(after.layout.axesKey).toBe(before.layout.axesKey);
  });
});

describe("audit: archive compatibility", () => {
  it("fills newly introduced state and settings fields when restoring an older archive", () => {
    const archive = serializeArchive(dataset, initialView(dataset), {
      xRange: [0, 1],
      yRange: [0, 1],
      width: 800,
      height: 600,
      offsets: [],
    });
    const legacy = JSON.parse(JSON.stringify(archive));
    delete legacy.state.populationNames;
    delete legacy.state.settings.axisFrame;
    delete legacy.state.settings.clampGroupLabelsToEdge;
    const restored = restoreArchiveState(legacy);
    expect(restored.populationNames).toEqual(["POP_A"]);
    expect(restored.settings.axisFrame).toBe("enclosed");
    expect(restored.settings.clampGroupLabelsToEdge).toBe(true);
  });
});
