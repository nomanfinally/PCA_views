import { expect, test, type Page } from "@playwright/test";
const fixture =
  "#eigvals: 10 5 2\nAlpha -0.2 0.1 0.3 Group_A\nBeta 0.2 -0.1 -0.3 Group_B\nGamma 0 0 0.1 Group_A\nDelta -0.1 -0.15 0.2 Group_A";
async function upload(page: Page, contents = fixture, name = "test.evec") {
  await page.getByTestId("file-input").setInputFiles({
    name,
    mimeType: "text/plain",
    buffer: Buffer.from(contents),
  });
}
async function plotReady(page: Page) {
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.data?.length ?? 0),
    )
    .toBeGreaterThan(0);
  await expect(page.getByText("Preparing plot…")).toHaveCount(0);
}
async function load(page: Page) {
  await page.goto("/");
  await upload(page);
  await plotReady(page);
}
async function range(page: Page) {
  return page
    .locator(".plot")
    .evaluate((e: any) => [...e._fullLayout.xaxis.range] as number[]);
}
async function point(page: Page, x: number, y: number) {
  return page.locator(".plot").evaluate(
    (el: any, p) => {
      const r = el.getBoundingClientRect(),
        l = el._fullLayout;
      return {
        x: r.left + l.xaxis._offset + l.xaxis.l2p(p.x),
        y: r.top + l.yaxis._offset + l.yaxis.l2p(p.y),
      };
    },
    { x, y },
  );
}
async function editPop(page: Page, name = "Group_A") {
  await page.locator(`[data-population="${name}"]`).click({ button: "right" });
}

test("compact shape palettes support group, individual, hollow and inherited shapes", async ({
  page,
}) => {
  await load(page);
  await editPop(page);
  const group = page.getByRole("group", {
    name: "Population marker",
    exact: true,
  });
  await expect(group.getByRole("radio")).toHaveCount(13);
  const square = group.getByRole("radio", { name: "square", exact: true });
  await square.check();
  await expect(square).toBeChecked();
  await square.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    group.getByRole("radio", { name: "diamond", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("Escape");
  const symbols = () =>
    page.locator(".plot").evaluate((el: any) => el.data[0].marker.symbol);
  await expect.poll(symbols).toEqual(["diamond", "diamond", "diamond"]);
  const location = await point(page, -0.2, 0.1);
  await page.mouse.click(location.x, location.y, { button: "right" });
  const sample = page.getByRole("group", { name: "Sample shape", exact: true });
  await expect(
    sample.getByRole("radio", { name: "Population default" }),
  ).toBeChecked();
  const hollow = sample.getByRole("radio", { name: "star", exact: true });
  await expect(sample.getByRole("radio")).toHaveCount(14);
  await expect(page.getByText("Marker treatment", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Sample marker style", { exact: true })
    .selectOption("hollow");
  await hollow.check();
  await expect(hollow).toBeChecked();
  // Hollow markers use transparent fills so their outlines remain customizable.
  await expect.poll(symbols).toEqual(["star", "diamond", "diamond"]);
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate((el: any) => el.data[0].marker.color[0].replace(/\s/g, "")),
    )
    .toBe("rgba(0,0,0,0)");
  await page.keyboard.press("Escape");
  await page.mouse.click(location.x, location.y, { button: "right" });
  await expect(hollow).toBeChecked();
  await sample.getByRole("radio", { name: "Population default" }).check();
  await page
    .getByLabel("Sample marker style", { exact: true })
    .selectOption("inherit");
  await expect.poll(symbols).toEqual(["diamond", "diamond", "diamond"]);
  // The palette remains compact and inside the editor on a narrow screen.
  await page.setViewportSize({ width: 375, height: 667 });
  const grid = sample.locator(".marker-shape-grid");
  await expect(grid).toHaveCSS(
    "grid-template-columns",
    "20px 20px 20px 20px 20px 20px 20px",
  );
  const box = await grid.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  expect(box!.height).toBeLessThan(150);
});

test("plot-first layout, upload, axes and mouse wheel zoom", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page);
  await expect(page.locator(".topbar")).toContainText("test.evec");
  await expect(page.locator(".topbar")).toContainText("4 samples");
  const bounds = await page.locator(".plot").boundingBox();
  expect(bounds!.height).toBeGreaterThan(850);
  expect(bounds!.width).toBeGreaterThan(1200);
  await page.getByLabel("Vertical axis").selectOption("2");
  await page.getByLabel("Swap axes").click();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.xaxis.title.text),
    )
    .toBe("PC3 (11.76%)");
  const start = await range(page),
    box = await page.locator(".plot").boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, -400);
  await expect
    .poll(async () => {
      const r = await range(page);
      return r[1] - r[0];
    })
    .toBeLessThan(start[1] - start[0]);
  const zoomed = await range(page);
  await page.mouse.wheel(0, 400);
  await expect
    .poll(async () => {
      const r = await range(page);
      return r[1] - r[0];
    })
    .toBeGreaterThan(zoomed[1] - zoomed[0]);
  await page.getByLabel("Reset axes", { exact: true }).click();
  await page.getByLabel("Zoom in", { exact: true }).click();
  await page.getByLabel("Zoom out", { exact: true }).click();
  await upload(page, "a 1 NaN pop");
  await expect(page.getByRole("alert")).toContainText("Line 1");
  await expect(page.locator(".dataset-name")).toHaveText("test.evec");
  await upload(page, "a 0 1 New\nb 2 3 New");
  await plotReady(page);
  await expect(page.getByLabel("Horizontal axis")).toHaveValue("0");
  await expect(page.getByLabel("Vertical axis")).toHaveValue("1");
  await page.getByLabel("Remove dataset").click();
  await expect(
    page.getByRole("heading", { name: "Explore your principal components" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("population context menu: colors, hulls, persistent hidden entries, and restoration", async ({
  page,
}) => {
  await load(page);
  await editPop(page);
  await page.getByLabel("Population color", { exact: true }).fill("#ff0000");
  await page.getByLabel("Convex hull", { exact: true }).check();
  await page.getByLabel("Regression line", { exact: true }).check();
  await page.getByRole("button", { name: "Close Group_A" }).click();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.data[0].marker.color),
    )
    .toEqual(["#ff0000", "#ff0000", "#ff0000"]);
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate((e: any) => e.layout.shapes.map((s: any) => s.name)),
    )
    .toEqual(["hull:Group_A", "regression:Group_A"]);
  await editPop(page);
  await page
    .getByRole("button", { name: "Hide population", exact: true })
    .click();
  await page.getByRole("button", { name: "Close Group_A" }).click();
  await expect(page.locator('[data-population="Group_A"]')).toHaveClass(
    /is-hidden/,
  );
  await expect(
    page.locator('[data-population="Group_A"] .hidden-label'),
  ).toBeVisible();
  await expect(page.locator(".statusbar")).toContainText(
    "1 populations hidden",
  );
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.shapes.length),
    )
    .toBe(0);
  await page.getByRole("button", { name: "Show Group_A", exact: true }).click();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.shapes.length),
    )
    .toBe(2);
  await page.getByLabel("Vertical axis").selectOption("2");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.yaxis.title.text),
    )
    .toBe("PC3 (11.76%)");
  await page.getByRole("button", { name: "Hide all", exact: true }).click();
  await expect(
    page.getByText(
      "No visible samples. Show populations in the legend or clear your search.",
    ),
  ).toBeVisible();
  await expect(page.locator(".legend-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await expect(page.locator(".statusbar")).toContainText(
    "4 / 4 samples visible",
  );
});

test("individual point marks and color overrides persist independently", async ({
  page,
}) => {
  await load(page);
  const p = await point(page, -0.2, 0.1);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator(".statusbar")).toContainText("1 marked");
  await expect(
    page.getByRole("region", { name: "Sample details" }),
  ).toHaveCount(0);
  await page.mouse.click(p.x, p.y, { button: "right" });
  await expect(
    page.getByRole("dialog", { name: "Edit sample: Alpha" }),
  ).toBeVisible();
  await expect(page.getByLabel("Red boundary", { exact: true })).toBeChecked();
  await page.getByLabel("Sample color", { exact: true }).fill("#123456");
  await page.keyboard.press("Escape");
  await editPop(page);
  await page.getByLabel("Population color", { exact: true }).fill("#ff0000");
  await page.getByRole("button", { name: "Close Group_A" }).click();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.data[0].marker.color),
    )
    .toEqual(["#123456", "#ff0000", "#ff0000"]);
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate(
          (e: any) => e.data.find((t: any) => t.name === "marked")?.customdata,
        ),
    )
    .toEqual([0]);
  await page.getByLabel("Vertical axis").selectOption("2");
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate((e: any) => e.data.find((t: any) => t.name === "marked")?.y),
    )
    .toEqual([0.3]);
});

test("box and lasso select, mark selection, pan and box zoom", async ({
  page,
}) => {
  await load(page);
  await page.getByLabel("Box select mode").click();
  await expect
    .poll(() => page.locator(".plot").evaluate((e: any) => e.layout.dragmode))
    .toBe("select");
  const a = await point(page, -0.215, 0.11),
    b = await point(page, 0.04, -0.16);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator(".selection-bar")).toContainText("3 selected");
  await page
    .getByRole("button", { name: "Mark selected", exact: true })
    .click();
  await expect(page.locator(".statusbar")).toContainText("3 marked");
  await page.getByLabel("Clear selection", { exact: true }).click();
  await page.getByLabel("Lasso select mode").click();
  const corners = await Promise.all([
    point(page, 0.15, -0.05),
    point(page, 0.22, -0.05),
    point(page, 0.22, -0.15),
    point(page, 0.15, -0.15),
  ]);
  await page.mouse.move(corners[0].x, corners[0].y);
  await page.mouse.down();
  for (const p of [...corners.slice(1), corners[0]])
    await page.mouse.move(p.x, p.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".selection-bar")).toContainText("1 selected");
  await page.getByLabel("Clear selection", { exact: true }).click();
  await page.getByLabel("Box zoom mode").click();
  const original = await range(page);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () => {
      const r = await range(page);
      return r[1] - r[0];
    })
    .toBeLessThan(original[1] - original[0]);
  await page.getByLabel("Pan mode").click();
  const before = await range(page),
    box = await page.locator(".plot").boundingBox();
  await page.mouse.move(box!.x + 300, box!.y + 200);
  await page.mouse.down();
  await page.mouse.move(box!.x + 370, box!.y + 200, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () => Math.abs((await range(page))[0] - before[0]))
    .toBeGreaterThan(0.001);
});

test("display tools, data table, exports and mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Try an example dataset" }).click();
  await plotReady(page);
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await page.getByLabel("Color palette").selectOption("earth");
  await page
    .getByLabel("Marker style", { exact: true })
    .selectOption("hollow-shapes");
  await page.getByRole("tab", { name: "Labels", exact: true }).click();
  await page.getByLabel("Point labels", { exact: true }).selectOption("sample");
  await page.getByLabel("Population labels", { exact: true }).check();
  await page
    .getByLabel("Group label style", { exact: true })
    .selectOption("background");
  await page.getByRole("tab", { name: "Geometry", exact: true }).click();
  await page.getByLabel("All convex hulls", { exact: true }).check();
  await page.getByLabel("All regression lines", { exact: true }).check();
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await page.getByLabel("Grayscale", { exact: true }).check();
  await page.getByRole("tab", { name: "Chart", exact: true }).click();
  await page.getByLabel("Plot subtitle").fill("Test subtitle");
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.annotations.length),
    )
    .toBe(6);
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.shapes.length),
    )
    .toBe(12);
  await expect
    .poll(() => page.locator(".plot").evaluate((e: any) => e.data[0].mode))
    .toBe("markers+text");
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await page.getByRole("button", { name: "Reset styles", exact: true }).click();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByLabel("Sample table", { exact: true }).click();
  await page.getByRole("button", { name: "DEMO_001", exact: true }).click();
  await expect(page.locator(".point-inspector")).toContainText("DEMO_001");
  await page.keyboard.press("Escape");
  await page.getByLabel("Export", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "Example dataset_PC1_PC2.png",
  );
  await page.getByLabel("Export", { exact: true }).click();
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Filtered samples · CSV" }).click();
  expect((await csv).suggestedFilename()).toBe("Example dataset_filtered.csv");
  await page.screenshot({ path: "test-results/desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Toggle legend", { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate((el: any) =>
          Math.abs(
            el.querySelector(".main-svg").getBoundingClientRect().width -
              el.clientWidth,
          ),
        ),
    )
    .toBeLessThan(2);
  await page.screenshot({ path: "test-results/mobile.png" });
  expect(errors).toEqual([]);
});

test("invalid extensions and drag and drop", async ({ page }) => {
  await page.goto("/");
  await upload(page, fixture, "wrong.txt");
  await expect(page.getByRole("alert")).toContainText(".evec extension");
  await page.locator(".app-shell").evaluate((el, text) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], "dropped.evec"));
    el.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
    );
  }, fixture);
  await plotReady(page);
  await expect(page.locator(".dataset-name")).toHaveText("dropped.evec");
});

test("PNG legend preserves population color and current zoom after a point override", async ({
  page,
}) => {
  await load(page);
  const position = await point(page, -0.2, 0.1);
  await page.mouse.click(position.x, position.y, { button: "right" });
  await page.getByLabel("Sample color", { exact: true }).fill("#ff0000");
  await page.keyboard.press("Escape");
  await editPop(page);
  await page.getByLabel("Population color", { exact: true }).fill("#39786b");
  await page.getByRole("button", { name: "Close Group_A" }).click();
  await page.getByLabel("Zoom in", { exact: true }).click();
  const viewport = await range(page);
  await page.getByLabel("Export", { exact: true }).click();
  const preview = page.getByAltText("PNG export preview");
  await expect(preview).toBeVisible();
  const dimensions = await preview.evaluate((e: HTMLImageElement) => ({
    width: e.dataset.chartWidth,
    height: e.dataset.chartHeight,
  }));
  const before = await preview.getAttribute("src");
  await page.getByLabel("Export title", { exact: true }).fill("Export heading");
  await page
    .getByLabel("Export subtitle", { exact: true })
    .fill("Independent subtitle");
  await page.getByLabel("Legend font size", { exact: true }).fill("24");
  await page.getByLabel("Legend box boundary", { exact: true }).check();
  await expect(preview).not.toHaveAttribute("src", before!);
  expect(
    await preview.evaluate((e: HTMLImageElement) => ({
      width: e.dataset.chartWidth,
      height: e.dataset.chartHeight,
    })),
  ).toEqual(dimensions);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  await (await download).saveAs("test-results/export-population-style.png");
  expect(await range(page)).toEqual(viewport);
  await expect(page.locator("[data-export-chart]")).toHaveCount(0);
});

test("population editor retains keyboard focus and stays onscreen on resize", async ({
  page,
}) => {
  await load(page);
  await page.getByLabel("Edit Group_A", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Group_A", exact: true });
  await expect(
    page.getByRole("button", { name: "Close Group_A" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Reset population style", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close Group_A" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 390, height: 500 });
  await expect
    .poll(async () => {
      const r = await dialog.boundingBox();
      return (
        !!r &&
        r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.width <= 390 &&
        r.y + r.height <= 500
      );
    })
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Edit Group_A", { exact: true })).toBeFocused();
});

for (const renderer of ["SVG", "WebGL"] as const) {
  test(`${renderer}: rapid wheel zoom stays anchored and survives appearance edits`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    const contents =
      renderer === "SVG"
        ? fixture
        : Array.from(
            { length: 6001 },
            (_, i) =>
              `s${i} ${Math.sin(i) * 0.2} ${Math.cos(i) * 0.2} ${i / 6001} Group_A`,
          ).join("\n");
    await upload(page, contents);
    await plotReady(page);
    expect(
      await page.locator(".plot").evaluate((el: any) => el.data[0].type),
    ).toBe(renderer === "SVG" ? "scatter" : "scattergl");
    expect(
      await page
        .locator(".plot")
        .evaluate((el: any) => el.data[0].marker.line.width[0]),
    ).toBe(0.8);
    const start = await range(page);
    const cursor = await page.locator(".plot").evaluate((el: any) => {
      const r = el.getBoundingClientRect(),
        l = el._fullLayout;
      return {
        x: Math.floor(r.left + l.xaxis._offset + l.xaxis._length * 0.37),
        y: Math.floor(r.top + l.yaxis._offset + l.yaxis._length * 0.55),
        fraction: Math.floor(l.xaxis._length * 0.37) / l.xaxis._length,
      };
    });
    const anchor = start[0] + (start[1] - start[0]) * cursor.fraction;
    await page.mouse.move(cursor.x, cursor.y);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -40);
    const expectedSpan = (start[1] - start[0]) * Math.exp(-480 * 0.0015);
    await expect
      .poll(async () => {
        const r = await range(page);
        return r[1] - r[0];
      })
      .toBeCloseTo(expectedSpan, 6);
    const zoomed = await range(page);
    expect(zoomed[0] + (zoomed[1] - zoomed[0]) * cursor.fraction).toBeCloseTo(
      anchor,
      6,
    );
    await page
      .getByRole("button", { name: "Toggle grid", exact: true })
      .click();
    await expect
      .poll(() =>
        page.locator(".plot").evaluate((el: any) => el.layout.xaxis.showgrid),
      )
      .toBe(false);
    expect(await range(page)).toEqual(zoomed);
    await page
      .getByRole("button", { name: "Toggle grayscale", exact: true })
      .click();
    await page.mouse.move(cursor.x, cursor.y);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 40);
    await expect
      .poll(async () => (await range(page))[0])
      .toBeCloseTo(start[0], 6);
    await expect
      .poll(async () => (await range(page))[1])
      .toBeCloseTo(start[1], 6);
    await page.getByLabel("Reset axes", { exact: true }).click();
    expect(errors).toEqual([]);
  });
}

test("compact legend search and draggable group labels retain offsets per PC pair", async ({
  page,
}) => {
  await load(page);
  await expect(page.getByLabel("Find population", { exact: true })).toHaveCount(
    0,
  );
  expect((await page.locator(".chart-tools").boundingBox())!.x).toBeLessThan(
    15,
  );
  expect(
    (await page.locator(".legend-row").first().boundingBox())!.height,
  ).toBeLessThanOrEqual(24);
  await page
    .getByRole("button", { name: "Search populations", exact: true })
    .click();
  await page.getByLabel("Find population", { exact: true }).fill("Group_B");
  await expect(page.locator(".legend-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Search populations", exact: true })
    .click();
  await expect(page.locator(".legend-row")).toHaveCount(2);
  await page.getByRole("button", { name: /^Cycle population labels:/ }).click();
  const annotation = () =>
    page.locator(".plot").evaluate((el: any) => ({
      ax: el.layout.annotations[0].ax,
      ay: el.layout.annotations[0].ay,
    }));
  const label = page.locator(".annotation").filter({ hasText: "Group_A" });
  await expect(label).toBeVisible();
  const before = await annotation();
  const box = (await label.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 75,
    box.y + box.height / 2 + 35,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect
    .poll(annotation)
    .toEqual({ ax: before.ax + 75, ay: before.ay + 35 });
  const moved = await annotation();
  await page.getByRole("button", { name: /^Cycle hulls:/ }).click();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.layout.shapes.length),
    )
    .toBe(1);
  expect(await annotation()).toEqual(moved);
  await page.getByLabel("Vertical axis").selectOption("2");
  await expect.poll(annotation).toEqual(before);
  await page.getByLabel("Vertical axis").selectOption("1");
  await expect.poll(annotation).toEqual(moved);
  await page
    .getByLabel("Edit plot title and subtitle", { exact: true })
    .click();
  await expect(page.getByLabel("Plot title", { exact: true })).toBeFocused();
});

for (const renderer of ["SVG", "WebGL"] as const) {
  test(`${renderer}: tool cursors, click marking with hover off and individual right-click styling`, async ({
    page,
  }) => {
    await page.goto("/");
    const contents =
      renderer === "SVG"
        ? fixture
        : fixture +
          "\n" +
          Array.from(
            { length: 6000 },
            (_, i) =>
              `extra${i} ${0.05 + Math.sin(i) * 0.03} ${0.05 + Math.cos(i) * 0.03} 0.1 Group_B`,
          ).join("\n");
    await upload(page, contents);
    await plotReady(page);
    await page.getByLabel("Plot settings", { exact: true }).click();
    await page.getByRole("tab", { name: "Markers", exact: true }).click();
    await page.getByRole("tab", { name: "Hover", exact: true }).click();
    await page.getByLabel("Show hover information", { exact: true }).uncheck();
    await page.getByRole("tab", { name: "Markers", exact: true }).click();
    await page
      .getByLabel("Marker outlines", { exact: true })
      .selectOption("black");
    await page.keyboard.press("Escape");
    const p = await point(page, -0.2, 0.1);
    const modes = [
      "Pan mode",
      "Box zoom mode",
      "Box select mode",
      "Lasso select mode",
    ];
    const cursors = ["grab", "zoom-in", "crosshair", "data:image/svg+xml"];
    for (let i = 0; i < modes.length; i++) {
      await page.getByLabel(modes[i], { exact: true }).click();
      const cursor = await page
        .locator(".nsewdrag")
        .evaluate((el) => getComputedStyle(el).cursor);
      expect(cursor).toContain(cursors[i]);
      await page.mouse.click(p.x, p.y);
      await expect
        .poll(() =>
          page
            .locator(".plot")
            .evaluate(
              (el: any) =>
                el.data.find((trace: any) => trace.name === "marked")
                  ?.customdata ?? [],
            ),
        )
        .toEqual(i % 2 ? [] : [0]);
      await expect(
        page.getByRole("dialog", { name: "Edit sample: Alpha" }),
      ).toHaveCount(0);
    }
    await page.mouse.click(p.x, p.y, { button: "right" });
    const editor = page.getByRole("dialog", { name: "Edit sample: Alpha" });
    await expect(editor).toBeVisible();
    await expect(
      page.getByLabel("Red boundary", { exact: true }),
    ).not.toBeChecked();
    await page
      .getByRole("group", { name: "Sample shape", exact: true })
      .getByRole("radio", { name: "hexagon", exact: true })
      .check();
    await page.getByLabel("Sample size", { exact: true }).fill("18");
    await page.getByLabel("Sample color", { exact: true }).fill("#ffaacc");
    await page
      .getByLabel("Sample outline", { exact: true })
      .selectOption("custom");
    await page
      .getByLabel("Sample outline color", { exact: true })
      .fill("#112233");
    await page.keyboard.press("Escape");
    const appearance = () =>
      page.locator(".plot").evaluate((el: any) => {
        const m = el.data[0].marker;
        return {
          color: m.color[0],
          symbol: m.symbol[0],
          size: m.size[0],
          outline: m.line.color[0],
          otherSize: m.size[1],
        };
      });
    const expected = {
      color: "#ffaacc",
      symbol: "hexagon",
      size: 18,
      outline: "#112233",
      otherSize: 7,
    };
    await expect.poll(appearance).toEqual(expected);
    await editPop(page);
    await page.getByLabel("Population color", { exact: true }).fill("#00aabb");
    await page
      .getByRole("group", { name: "Population marker", exact: true })
      .getByRole("radio", { name: "square", exact: true })
      .check();
    await page.keyboard.press("Escape");
    await expect.poll(appearance).toEqual(expected);
    await page.getByLabel("Vertical axis").selectOption("2");
    const moved = await point(page, -0.2, 0.3);
    await page.mouse.click(moved.x, moved.y, { button: "right" });
    await expect(editor).toBeVisible();
    await page
      .getByRole("button", { name: "Reset this sample", exact: true })
      .click();
    await expect.poll(appearance).toEqual({
      color: "#00aabb",
      symbol: "square",
      size: 7,
      outline: "#000000",
      otherSize: 7,
    });
    await page.keyboard.press("Escape");
    await page.getByLabel("Pan mode", { exact: true }).click();
    await page.mouse.move(moved.x, moved.y);
    await page.mouse.down();
    await expect(page.locator(".nsewdrag")).toHaveCSS("cursor", "grabbing");
    await page.mouse.move(moved.x + 40, moved.y + 30, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(() =>
        page
          .locator(".plot")
          .evaluate((el: any) =>
            el.data.some((trace: any) => trace.name === "marked"),
          ),
      )
      .toBe(false);
  });
}

test("legend layout, ratio thumbnails, population styles and separate alpha controls", async ({
  page,
}) => {
  await load(page);
  await expect(
    page.locator(".workspace-toolbar .search-tools > button"),
  ).toHaveAttribute("aria-label", "Toggle legend");
  await expect(page.getByLabel("Collapse legend", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.locator(".chart-tools").getByLabel("Toggle legend", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Legend layout", { exact: true }).click();
  await page
    .getByLabel("Legend position", { exact: true })
    .selectOption("bottom-left");
  await page.getByLabel("Legend columns", { exact: true }).selectOption("2");
  await page.keyboard.press("Escape");
  await expect(page.locator(".legend-dock")).toHaveAttribute(
    "data-position",
    "bottom-left",
  );
  expect(
    await page
      .locator(".legend-list")
      .evaluate(
        (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(2);
  await editPop(page);
  await page
    .getByLabel("Population marker style", { exact: true })
    .selectOption("hollow-shapes");
  await page.getByLabel("Population label", { exact: true }).check();
  await page
    .getByLabel("Population label style", { exact: true })
    .selectOption("boxed");
  await page.getByLabel("Convex hull", { exact: true }).check();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.data[0].marker.symbol),
    )
    .toEqual(["circle", "square", "triangle-up"]);
  await page
    .getByLabel("Population marker style", { exact: true })
    .selectOption("filled");
  await page.getByText("More marker controls", { exact: true }).click();
  await page.getByLabel("Population marker size", { exact: true }).fill("16");
  await page
    .getByLabel("Population fill opacity", { exact: true })
    .fill("0.25");
  await page
    .getByLabel("Population boundary opacity", { exact: true })
    .fill("0.75");
  await page.getByText("More label & hull controls", { exact: true }).click();
  await page.getByLabel("Population hull opacity", { exact: true }).fill("0.5");
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => ({
        size: e.data[0].marker.size[0],
        color: e.data[0].marker.color[0].endsWith(",0.25)"),
        boundary: e.data[0].marker.line.color[0].endsWith(",0.75)"),
        hull: e.layout.shapes[0].opacity,
        label: e.layout.annotations[0].borderwidth,
      })),
    )
    .toEqual({ size: 16, color: true, boundary: true, hull: 0.5, label: 1 });
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await page.getByRole("tab", { name: "Chart", exact: true }).click();
  for (const ratio of ["1:1", "16:9", "4:3", "3:2", "4:5", "9:16"]) {
    await page.getByLabel(`Chart ratio ${ratio}`, { exact: true }).click();
    const [x, y] = ratio.split(":").map(Number);
    await expect
      .poll(async () => {
        const r = (await page.locator(".plot").boundingBox())!;
        return r.width / r.height;
      })
      .toBeCloseTo(x / y, 2);
  }
  await page.getByLabel("Chart ratio Full span", { exact: true }).click();
  await page.keyboard.press("Escape");
  const before = await range(page);
  await page.getByRole("button", { name: /^Cycle population labels:/ }).click();
  await page.getByRole("button", { name: /^Cycle hulls:/ }).click();
  await page.getByRole("button", { name: /^Cycle boundary opacity:/ }).click();
  expect(await range(page)).toEqual(before);
  await page.getByLabel("Toggle legend", { exact: true }).click();
  await expect(page.locator(".legend-dock")).toHaveCount(0);
});

test("variance totals, FID hover, and PNG preview with multiple legend columns", async ({
  page,
}) => {
  await load(page);
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.xaxis.title.text),
    )
    .toBe("PC1 (58.82%)");
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await page.getByRole("tab", { name: "Variance", exact: true }).click();
  await page.getByLabel("Import eigenvalues", { exact: true }).setInputFiles({
    name: "test.eval",
    mimeType: "text/plain",
    buffer: Buffer.from("10\n5\n2\n3"),
  });
  await page
    .getByRole("button", { name: "Use this as the full spectrum", exact: true })
    .click();
  await page.getByRole("tab", { name: "Hover", exact: true }).click();
  await page.getByLabel("FID · Population / group", { exact: true }).check();
  await page.getByLabel("IID · Sample ID", { exact: true }).uncheck();
  await page.getByLabel("PC coordinates", { exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.xaxis.title.text),
    )
    .toBe("PC1 (50.00%)");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.data[0].hovertext[0]),
    )
    .toBe("Group_A");
  const before = await range(page);
  await page.getByLabel("Export", { exact: true }).click();
  await page
    .getByLabel("Export legend position", { exact: true })
    .selectOption("bottom");
  await page.getByLabel("Export legend columns", { exact: true }).fill("2");
  await expect(page.getByAltText("PNG export preview")).toBeVisible();
  expect(
    await page
      .getByAltText("PNG export preview")
      .evaluate((e: HTMLImageElement) => e.naturalWidth),
  ).toBeGreaterThan(1000);
  expect(await range(page)).toEqual(before);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});

test("settings tabs isolate sections, preserve edits, trap focus and fit mobile", async ({
  page,
}) => {
  await load(page);
  await expect(page.locator(".topbar").getByLabel("Toggle legend")).toHaveCount(
    0,
  );
  await expect(
    page.locator(".chart-tools").getByRole("button", { name: /legend/i }),
  ).toHaveCount(0);
  await expect(
    page.locator(".search-tools").getByLabel("Search samples"),
  ).toBeVisible();
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Plot settings" });
  await expect(
    page.getByRole("tab", { name: "Markers", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await expect(page.getByLabel("Hover content", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Color palette").selectOption("earth");
  await page.getByRole("tab", { name: "Markers", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("tab", { name: "Labels", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Color palette")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("tabpanel", { name: "Labels", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Color palette")).toHaveCount(0);
  await page.getByRole("tab", { name: "Hover", exact: true }).click();
  await expect(dialog.getByLabel("Import FIDs")).toHaveCount(0);
  await page.getByLabel("FID · Population / group", { exact: true }).uncheck();
  await page.getByLabel("PC coordinates", { exact: true }).uncheck();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.data[0].hovertext[0]),
    )
    .toBe("Alpha");
  await page.getByLabel("FID · Population / group", { exact: true }).check();
  await page.getByLabel("FID · Population / group", { exact: true }).check();
  await page.getByLabel("IID · Sample ID", { exact: true }).uncheck();
  await page.getByLabel("PC coordinates", { exact: true }).uncheck();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.data[0].hovertext[0]),
    )
    .toBe("Group_A");
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await expect(page.getByLabel("Color palette")).toHaveValue("earth");
  await page.getByRole("button", { name: "Done", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByLabel("Close settings", { exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 390, height: 700 });
  for (const name of [
    "Markers",
    "Labels",
    "Hover",
    "Chart",
    "Legend",
    "Geometry",
    "Variance",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
    expect(
      await page
        .getByRole("tabpanel")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
  }
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(700);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Plot settings", { exact: true })).toBeFocused();
});

test("settings tabs stay reachable above the footer in landscape", async ({
  page,
}) => {
  await load(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByLabel("Plot settings", { exact: true }).click();
  const tabs = page.getByRole("tablist", { name: "Settings sections" });
  const variance = page.getByRole("tab", { name: "Variance", exact: true });
  await page.keyboard.press("End");
  await expect(variance).toBeFocused();
  // Moving focus must not activate a different section until Enter/Space.
  await expect(
    page.getByRole("tabpanel", { name: "Chart", exact: true }),
  ).toBeVisible();
  const tabBox = (await variance.boundingBox())!;
  const listBox = (await tabs.boundingBox())!;
  const footerBox = (await page.locator(".settings-footer").boundingBox())!;
  expect(tabBox.y).toBeGreaterThanOrEqual(listBox.y);
  expect(tabBox.y + tabBox.height).toBeLessThanOrEqual(footerBox.y);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("tabpanel", { name: "Variance", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Total variance", { exact: true }).fill("20");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Plot settings" })).toHaveCount(
    0,
  );
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => e.layout.xaxis.title.text),
    )
    .toBe("PC1 (50.00%)");
});

test("simplified label and hover tools, and chart typography", async ({
  page,
}) => {
  await load(page);
  await expect(
    page.getByRole("button", {
      name: /Cycle palette:|Cycle marker preset:|Cycle hover content:|Cycle point size:/,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Toggle hover information", exact: true })
    .click();
  await expect
    .poll(() => page.locator(".plot").evaluate((e: any) => e.layout.hovermode))
    .toBe(false);
  await page
    .getByRole("button", { name: "Toggle hover information", exact: true })
    .click();
  for (const style of ["plain", "background", "boxed", "off"]) {
    await page
      .getByRole("button", { name: /^Cycle population labels:/ })
      .click();
    await expect(
      page.getByRole("button", {
        name: `Cycle population labels: ${style}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.locator(".plot").evaluate((e: any) => e.layout.annotations.length),
      )
      .toBe(style === "off" ? 0 : 2);
  }
  await page.getByLabel("Plot settings", { exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Chart", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("Tick text size", { exact: true }).fill("18");
  await page.getByLabel("Axes thickness", { exact: true }).selectOption("2");
  await page.getByLabel("Axis title size", { exact: true }).fill("24");
  await page
    .getByLabel("Axis title weight", { exact: true })
    .selectOption("700");
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => ({
        tick: e.layout.xaxis.tickfont.size,
        line: e.layout.xaxis.linewidth,
        title: e.layout.xaxis.title.font.size,
        weight: e.layout.xaxis.title.font.weight,
      })),
    )
    .toEqual({ tick: 18, line: 2, title: 24, weight: 700 });
});

for (const renderer of ["SVG", "WebGL"] as const) {
  test(`${renderer}: single HTML archive restores styles and zoom and works offline`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(90000);
    await page.goto("/");
    await upload(
      page,
      renderer === "SVG"
        ? fixture
        : fixture +
            "\n" +
            Array.from(
              { length: 5001 },
              (_, i) =>
                `extra${i} ${0.05 + Math.sin(i) * 0.03} ${0.05 + Math.cos(i) * 0.03} .1 Group_B`,
            ).join("\n"),
    );
    await plotReady(page);
    const p = await point(page, -0.2, 0.1);
    await page.mouse.click(p.x, p.y);
    await editPop(page);
    await page.getByLabel("Population color", { exact: true }).fill("#123456");
    await page.keyboard.press("Escape");
    await page.getByLabel("Hide Group_B", { exact: true }).click();
    await page.getByLabel("Zoom in", { exact: true }).click();
    const viewport = await range(page);
    await page.getByLabel("Export", { exact: true }).click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download interactive HTML", exact: true })
      .click();
    const path = testInfo.outputPath("archive.html");
    await (await download).saveAs(path);
    await context.setOffline(true);
    const offline = await context.newPage(),
      errors: string[] = [],
      requests: string[] = [];
    offline.on("pageerror", (e) => errors.push(e.message));
    offline.on("request", (r) => {
      if (/^https?:/.test(r.url())) requests.push(r.url());
    });
    await offline.goto(new URL(`file://${path}`).href);
    await plotReady(offline);
    expect(await range(offline)).toEqual(viewport);
    await expect(
      offline.getByLabel("Show Group_B", { exact: true }),
    ).toBeVisible();
    await expect(offline.locator(".statusbar")).toContainText("1 marked");
    expect(
      await offline
        .locator(".plot")
        .evaluate((e: any) => e.data[0].marker.color[0]),
    ).toBe("#123456");
    await offline.getByLabel("Show Group_B", { exact: true }).click();
    const box = (await offline.locator(".plot").boundingBox())!;
    await offline.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await offline.mouse.wheel(0, -220);
    await expect
      .poll(async () => {
        const r = await range(offline);
        return r[1] - r[0];
      })
      .toBeLessThan(viewport[1] - viewport[0]);
    await offline.getByLabel("Plot settings", { exact: true }).click();
    await offline.getByRole("tab", { name: "Markers", exact: true }).click();
    await offline
      .getByLabel("Color palette", { exact: true })
      .selectOption("earth");
    await offline.keyboard.press("Escape");
    await offline.getByLabel("Export", { exact: true }).click();
    await expect(offline.getByAltText("PNG export preview")).toBeVisible();
    const another = offline.waitForEvent("download");
    await offline
      .getByRole("button", { name: "Download interactive HTML", exact: true })
      .click();
    expect((await another).suggestedFilename()).toBe("test_interactive.html");
    await offline.keyboard.press("Escape");
    await upload(offline, fixture, "new.evec");
    await plotReady(offline);
    await expect(offline.locator(".dataset-name")).toHaveText("new.evec");
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
    await offline.close();
    await context.setOffline(false);
  });
}

test("PNG chart pixels stay identical across heading and legend arrangements", async ({
  page,
}) => {
  await load(page);
  await page.getByLabel("Zoom in", { exact: true }).click();
  await page.getByLabel("Export", { exact: true }).click();
  const preview = page.getByAltText("PNG export preview");
  const ready = () =>
    expect(
      page.getByRole("button", { name: "Download PNG", exact: true }),
    ).toBeEnabled();
  await ready();
  const pixels = () =>
    preview.evaluate(async (e: HTMLImageElement) => {
      await e.decode();
      const box = JSON.parse(e.dataset.plotBox!);
      const width = Math.floor(box.width * 2),
        height = Math.floor(box.height * 2);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        e,
        Math.ceil(JSON.parse(e.dataset.plotBox!).x * 2),
        Math.ceil(JSON.parse(e.dataset.plotBox!).y * 2),
        width,
        height,
        0,
        0,
        width,
        height,
      );
      const bytes = ctx.getImageData(0, 0, width, height).data;
      // File URLs need no crypto API; a deterministic pixel hash suffices here.
      let hash = 2166136261;
      for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
      return { hash, width, height };
    });
  const original = await pixels();
  await page
    .getByLabel("Export title", { exact: true })
    .fill("An independent heading");
  await page.getByLabel("Export subtitle", { exact: true }).fill("Subtitle");
  await page.getByLabel("Title font size", { exact: true }).fill("31");
  await page.getByLabel("Legend font size", { exact: true }).fill("19");
  await page.getByLabel("Export legend columns", { exact: true }).fill("2");
  for (const position of ["left", "top", "bottom", "right"]) {
    await page
      .getByLabel("Export legend position", { exact: true })
      .selectOption(position);
    await ready();
    expect(await pixels()).toEqual(original);
    const boxes = await preview.evaluate((e) => ({
      plot: JSON.parse(e.dataset.plotBox!),
      legend: JSON.parse(e.dataset.legendBox!),
    }));
    if (position === "left" || position === "right")
      expect(boxes.legend.y).toBeCloseTo(boxes.plot.y, 5);
    else
      expect(boxes.legend.x + boxes.legend.width / 2).toBeCloseTo(
        boxes.plot.x + boxes.plot.width / 2,
        5,
      );
  }
});

test("defaults, unified hull cycle, and two-sample fallback", async ({
  page,
}) => {
  await page.goto("/");
  await upload(
    page,
    "a 0 0 Pair\nb 1 1 Pair\nc 2 0 Three\nd 3 1 Three\ne 2 2 Three",
  );
  await plotReady(page);
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((e: any) => ({
        tick: e.layout.xaxis.tickfont.size,
        axis: e.layout.xaxis.linewidth,
        title: e.layout.xaxis.title.font.size,
        hover: e.data[0].hovertext,
      })),
    )
    .toEqual({ tick: 12, axis: 1.25, title: 14, hover: ["a", "b"] });
  await expect(
    page.getByRole("button", { name: "Toggle convex hulls", exact: true }),
  ).toHaveCount(0);
  for (const opacity of [5, 10, 15, 30, 50, 75, 0]) {
    await page.getByRole("button", { name: /^Cycle hulls:/ }).click();
    await expect(
      page.getByRole("button", {
        name: `Cycle hulls: ${opacity ? `${opacity}%` : "off"}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.locator(".plot").evaluate((e: any) =>
          e.layout.shapes.map((s: any) => ({
            name: s.name,
            opacity: s.opacity,
          })),
        ),
      )
      .toEqual(
        opacity
          ? [
              { name: "regression:Pair", opacity: opacity / 100 },
              { name: "hull:Three", opacity: opacity / 100 },
            ]
          : [],
      );
  }
  await page.getByLabel("Plot settings", { exact: true }).click();
  await expect(page.getByLabel("Axes thickness", { exact: true })).toHaveValue(
    "1.25",
  );
  expect(
    await page
      .getByLabel("Axes thickness", { exact: true })
      .locator("option")
      .allTextContents(),
  ).toEqual(["0.5", "1", "1.25", "1.5", "1.75", "2"]);
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await expect(page.getByLabel("Color palette", { exact: true })).toHaveValue(
    "solid",
  );
  await expect(page.getByLabel("Marker style", { exact: true })).toHaveValue(
    "circles",
  );
  await page.keyboard.press("Escape");
  await upload(
    page,
    Array.from({ length: 9 }, (_, i) => `sample${i} ${i} ${i} Pop${i}`).join(
      "\n",
    ),
    "nine.evec",
  );
  await plotReady(page);
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate((e: any) => e.data.map((t: any) => t.marker.symbol[0])),
    )
    .toEqual([
      "circle",
      "square",
      "triangle-up",
      "diamond",
      "triangle-down",
      "cross",
      "x",
      "triangle-left",
      "triangle-right",
    ]);
});

test("individual label, background and complete HTML state survive reopen and reset", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(90000);
  await load(page);
  const location = await point(page, -0.2, 0.1);
  await page.mouse.click(location.x, location.y, { button: "right" });
  await page.getByLabel("Red boundary", { exact: true }).check();
  await page
    .getByRole("group", { name: "Sample shape", exact: true })
    .getByRole("radio", { name: "diamond", exact: true })
    .check();
  await page
    .getByLabel("Sample marker style", { exact: true })
    .selectOption("hollow");
  await page.getByLabel("Sample size", { exact: true }).fill("16");
  await page.getByLabel("Show IID label", { exact: true }).check();
  await page.getByText("Label style & text", { exact: true }).click();
  await page
    .getByLabel("Sample label style", { exact: true })
    .selectOption("boxed");
  await page.getByLabel("Sample label size", { exact: true }).fill("18");
  await page.getByLabel("Sample label color", { exact: true }).fill("#123456");
  await page.getByText("Fill & boundary transparency", { exact: true }).click();
  await page.getByLabel("Sample boundary width", { exact: true }).fill("2.4");
  await page
    .getByLabel("Sample boundary opacity", { exact: true })
    .fill("0.75");
  await page.keyboard.press("Escape");
  const annotation = () =>
    page.locator(".plot").evaluate((e: any) => ({
      ax: e.layout.annotations[0].ax,
      ay: e.layout.annotations[0].ay,
    }));
  const label = page.locator(".annotation").filter({ hasText: "Alpha" });
  await expect(label).toBeVisible();
  const box = (await label.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 55,
    box.y + box.height / 2 + 25,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect.poll(annotation).toEqual({ ax: 77, ay: -3 });
  await page.getByLabel("Vertical axis").selectOption("2");
  await expect.poll(annotation).toEqual({ ax: 22, ay: -28 });
  await page.getByLabel("Vertical axis").selectOption("1");
  await expect.poll(annotation).toEqual({ ax: 77, ay: -3 });
  await page.getByLabel("Hide Group_B", { exact: true }).click();
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page
    .getByLabel("Chart background preset", { exact: true })
    .selectOption("#252a31");
  await page.getByLabel("Axes thickness", { exact: true }).selectOption("1.75");
  await page.getByRole("tab", { name: "Hover", exact: true }).click();
  await page.getByLabel("FID · Population / group", { exact: true }).check();
  await page.keyboard.press("Escape");
  await page.getByLabel("Zoom in", { exact: true }).click();
  const snapshot = (p: Page) =>
    p.locator(".plot").evaluate((e: any) => ({
      ranges: [e._fullLayout.xaxis.range, e._fullLayout.yaxis.range],
      markers: e.data.map((t: any) => ({
        name: t.name,
        marker: t.marker,
        keys: t.customdata,
      })),
      annotations: e.layout.annotations,
      background: e.layout.plot_bgcolor,
      grid: e.layout.xaxis.gridcolor,
      thickness: e.layout.xaxis.linewidth,
      hover: e.data[0].hovertext,
    }));
  const before = await snapshot(page);
  expect(before.background).toBe("#252a31");
  expect(before.grid).not.toBe("#252a31");
  await page.getByLabel("Export", { exact: true }).click();
  await expect(page.getByAltText("PNG export preview")).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download interactive HTML", exact: true })
    .click();
  const path = testInfo.outputPath("styled-session.html");
  await (await download).saveAs(path);
  await context.setOffline(true);
  const offline = await context.newPage();
  await offline.goto(`file://${path}`);
  await plotReady(offline);
  expect(await snapshot(offline)).toEqual(before);
  await expect(
    offline.getByLabel("Show Group_B", { exact: true }),
  ).toBeVisible();
  // Retain interactivity, then reset the archived dataset to application defaults.
  await offline.getByLabel("Plot settings", { exact: true }).click();
  await offline
    .getByLabel("Chart background preset", { exact: true })
    .selectOption("#faf5e9");
  await offline
    .getByRole("button", { name: "Reset to defaults", exact: true })
    .click();
  await plotReady(offline);
  const reset = await snapshot(offline);
  expect(reset.annotations).toEqual([]);
  expect(reset.background).toBe("#ffffff");
  expect(reset.thickness).toBe(1.25);
  expect(reset.markers.map((m: any) => m.name)).toEqual(["Group_A", "Group_B"]);
  expect(reset.markers[0].marker.symbol).toEqual([
    "circle",
    "circle",
    "circle",
  ]);
  expect(reset.hover).toEqual(["Alpha", "Gamma", "Delta"]);
  expect(reset.ranges[0][1] - reset.ranges[0][0]).toBeGreaterThan(
    before.ranges[0][1] - before.ranges[0][0],
  );
  await offline.close();
  await context.setOffline(false);
});
