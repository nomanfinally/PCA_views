import { describe, expect, it, vi } from "vitest";
import { formatCsvCell, samplesToCsv } from "../services/export/csvExport";
import {
  arrangeImage,
  defaultImageOptions,
  drawMarkerSwatch,
} from "../services/export/canvasComposer";
import {
  serializeArchive,
  restoreArchiveState,
  generateArchiveHtml,
} from "../services/export/archiveService";
import { defaultSettings } from "../core/models/settings";
import { parseEvec } from "../core/parsers/parseEvec";
import type { ResolvedMarkerStyle } from "../core/style/styleResolver";

const dataset = parseEvec("a 0 0 POP_A\nb 1 1 POP_B", "test.evec");

describe("services/export/csvExport", () => {
  it("escapes spreadsheet formulas with a leading apostrophe", () => {
    expect(formatCsvCell("=SUM(A1:A10)")).toBe("\"'=SUM(A1:A10)\"");
    expect(formatCsvCell("+cmd")).toBe("\"'+cmd\"");
    expect(formatCsvCell("-cmd")).toBe("\"'-cmd\"");
    expect(formatCsvCell("@cmd")).toBe("\"'@cmd\"");
  });

  it("exports samples with PC header and escaped quotes", () => {
    const csv = samplesToCsv(
      [
        {
          key: 0,
          id: 'Sample "One"',
          population: "PopA",
          pcs: [0.12, -0.34],
        },
      ],
      2,
    );
    expect(csv).toContain('"Sample","Population","PC1","PC2"');
    expect(csv).toContain('"Sample ""One""","PopA","0.12","-0.34"');
  });
});

describe("services/export/archiveService", () => {
  it("serializes and restores view state faithfully", () => {
    const mockState = {
      x: 0,
      y: 1,
      settings: defaultSettings,
      populations: new Map([["POP_A", { color: "#ff0000" }]]),
      points: new Map([[0, { marked: true }]]),
      selected: new Set([0]),
    };

    const viewport = {
      xRange: [-1, 1],
      yRange: [-1, 1],
      width: 800,
      height: 600,
      offsets: [] as [string, { ax: number; ay: number }][],
    };

    const archive = serializeArchive(dataset, mockState, viewport);
    expect(archive.version).toBe(1);
    expect(archive.dataset.samples).toHaveLength(2);

    const restored = restoreArchiveState(archive);
    expect(restored.populations.get("POP_A")?.color).toBe("#ff0000");
    expect(restored.points.get(0)?.marked).toBe(true);
    expect(restored.selected.has(0)).toBe(true);
  });

  it("escapes script tags and Unicode line separators in archive HTML", () => {
    const badDataset = parseEvec("s1 0 0 </script><script>alert(1)</script>", "evil.evec");
    const archive = serializeArchive(badDataset, { populations: new Map(), points: new Map(), selected: new Set() }, {
      xRange: [0, 1],
      yRange: [0, 1],
      width: 800,
      height: 600,
      offsets: [],
    });

    const html = generateArchiveHtml(archive, {
      js: "console.log('runtime');",
      css: "body { margin: 0; }",
    });

    expect(html).not.toContain("</script><script>alert(1)</script>");
    expect(html).toContain("\\u003c/script>");
  });
});

describe("services/export/canvasComposer", () => {
  it("arranges images with consistent headings and bounds", () => {
    const options = defaultImageOptions(defaultSettings);
    const measure = (t: string) => t.length * 8;
    const placement = arrangeImage(800, 600, ["POP_A", "POP_B"], options, measure);

    expect(placement.chart.width).toBe(800);
    expect(placement.chart.height).toBe(600);
    expect(placement.width).toBeGreaterThanOrEqual(800);
    expect(placement.height).toBeGreaterThanOrEqual(600);
  });

  it("draws marker swatches directly on Canvas 2D without throwing", () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const appearance: ResolvedMarkerStyle = {
      color: "#ff0000",
      symbol: "diamond",
      size: 8,
      fillOpacity: 0.9,
      outlineOpacity: 1,
      line: { color: "#000000", width: 1 },
      isHollow: false,
    };

    drawMarkerSwatch(mockCtx, 10, 10, 6, appearance);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });
});
