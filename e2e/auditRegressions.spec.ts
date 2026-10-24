import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const fixture =
  "#eigvals: 10 5 2\nAlpha -0.2 0.1 0.3 Group_A\nBeta 0.2 -0.1 -0.3 Group_B\nGamma 0 0 0.1 Group_A";

async function upload(page: Page, name = "audit.evec", text = fixture) {
  await page
    .getByTestId("file-input")
    .setInputFiles({ name, mimeType: "text/plain", buffer: Buffer.from(text) });
  await expect(page.locator(".dataset-name")).toHaveText(name);
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.data?.length ?? 0),
    )
    .toBeGreaterThan(0);
}

async function changeGroup(page: Page) {
  await page.getByLabel("Sample table", { exact: true }).click();
  await page.getByLabel("Edit population for Alpha", { exact: true }).click();
  await page
    .getByLabel("Edit Group ID for Alpha", { exact: true })
    .fill("New_Group");
  await page
    .getByLabel("Edit Group ID for Alpha", { exact: true })
    .press("Enter");
  await page.keyboard.press("Escape");
}

test("archive keeps original groups, and offline imports never restore stale state", async ({
  page,
  context,
}, info) => {
  await page.goto("/");
  await upload(page);
  await changeGroup(page);
  await page.getByLabel("Vertical axis", { exact: true }).selectOption("2");
  await page.getByLabel("Export", { exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download interactive HTML", exact: true })
    .click();
  const path = info.outputPath("session.html");
  await (await downloadPromise).saveAs(path);
  const html = await readFile(path, "utf8");
  const archive = JSON.parse(
    html.match(
      /<script id="pca-archive" type="application\/json">([\s\S]+?)<\/script>/,
    )![1],
  );
  expect(archive.dataset.samples[0].population).toBe("Group_A");
  expect(archive.state.samplePopulations).toEqual([[0, "New_Group"]]);

  await context.setOffline(true);
  const offline = await context.newPage();
  const errors: string[] = [];
  offline.on("pageerror", (e) => errors.push(e.message));
  await offline.goto(`file://${path}`);
  await expect(
    offline.getByLabel("Vertical axis", { exact: true }),
  ).toHaveValue("2");
  await offline.getByLabel("Sample table", { exact: true }).click();
  await offline
    .getByLabel("Reset population for Alpha", { exact: true })
    .click();
  await expect(offline.locator("tbody tr").first()).toContainText("Group_A");
  await offline.keyboard.press("Escape");
  await upload(offline, "second.evec", "second 0 1 X\nother 1 0 Y");
  await expect(
    offline.getByLabel("Vertical axis", { exact: true }),
  ).toHaveValue("1");
  await expect
    .poll(() =>
      offline
        .locator(".plot")
        .evaluate((el: any) => el.data.map((t: any) => t.name)),
    )
    .toEqual(["X", "Y"]);
  await upload(offline, "third.evec", "third 0 1 Z");
  await expect
    .poll(() =>
      offline
        .locator(".plot")
        .evaluate((el: any) => el.data.map((t: any) => t.name)),
    )
    .toEqual(["Z"]);
  await offline.getByLabel("Remove dataset", { exact: true }).click();
  await offline.getByRole("button", { name: "Try an example dataset" }).click();
  await expect(
    offline.getByLabel("Vertical axis", { exact: true }),
  ).toHaveValue("1");
  expect(errors).toEqual([]);
});

test("filtered CSV respects visibility and selection export uses edited groups", async ({
  page,
}, info) => {
  await page.goto("/");
  await upload(page);
  await changeGroup(page);
  // Select Alpha using the same public event sent by Plotly after a box selection.
  await page
    .locator(".plot")
    .evaluate((el: any) =>
      el.emit("plotly_selected", {
        points: [{ customdata: 0 }],
        range: { x: [-1, 1], y: [-1, 1] },
      }),
    );
  const selectedPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export selection", exact: true })
    .click();
  const selectedPath = info.outputPath("selected.csv");
  await (await selectedPromise).saveAs(selectedPath);
  expect(await readFile(selectedPath, "utf8")).toContain('"Alpha","New_Group"');

  await page.getByLabel("Clear selection", { exact: true }).click();
  await page.getByLabel("Search samples", { exact: true }).fill("Beta");
  await page.getByLabel("Export", { exact: true }).click();
  const filteredPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Filtered samples · CSV", exact: true })
    .click();
  const filteredPath = info.outputPath("filtered.csv");
  await (await filteredPromise).saveAs(filteredPath);
  const csv = await readFile(filteredPath, "utf8");
  expect(csv.trim().split(/\r?\n/)).toHaveLength(2);
  expect(csv).toContain('"Beta","Group_B"');
});

test("dragged labels survive zoom, and reset to defaults clears label positions", async ({
  page,
}) => {
  await page.goto("/");
  await upload(page);
  await page.getByRole("button", { name: /^Cycle population labels:/ }).click();
  const label = page.locator(".annotation").filter({ hasText: "Group_A" });
  await expect(label).toBeVisible();
  const box = (await label.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 60,
    box.y + box.height / 2 + 20,
    { steps: 10 },
  );
  await page.mouse.up();
  const offset = () =>
    page.locator(".plot").evaluate((el: any) => {
      const annotation = el.layout?.annotations?.[0];
      return annotation ? { ax: annotation.ax, ay: annotation.ay } : null;
    });
  await expect.poll(offset).toEqual({ ax: 82, ay: -8 });
  await page.getByLabel("Zoom in", { exact: true }).click();
  await expect.poll(offset).toEqual({ ax: 82, ay: -8 });
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Reset to defaults", exact: true })
    .click();
  await page.getByRole("button", { name: /^Cycle population labels:/ }).click();
  await expect.poll(offset).toEqual({ ax: 22, ay: -28 });
});

test("variance formatting preserves zoom and clearing the total restores valid percentages", async ({
  page,
}) => {
  await page.goto("/");
  await upload(page);
  await page.getByLabel("Zoom in", { exact: true }).click();
  const range = () =>
    page.locator(".plot").evaluate((el: any) => [...el.layout.xaxis.range]);
  await expect
    .poll(async () => (await range())[1] - (await range())[0])
    .toBeLessThan(0.464);
  const before = await range();
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByRole("tab", { name: "Variance", exact: true }).click();
  await page
    .getByLabel("Display variance on axis titles", { exact: true })
    .uncheck();
  await expect.poll(range).toEqual(before);
  await page
    .getByLabel("Display variance on axis titles", { exact: true })
    .check();
  await page.getByLabel("Total variance", { exact: true }).fill("100");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.layout.xaxis.title.text),
    )
    .toBe("PC1 (10.00%)");
  await page.getByLabel("Total variance", { exact: true }).fill("");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.layout.xaxis.title.text),
    )
    .toBe("PC1 (58.82%)");
  await expect.poll(range).toEqual(before);
});

test("group editor rejects whitespace without losing the table or editing data", async ({
  page,
}) => {
  await page.goto("/");
  await upload(page);
  await page.getByLabel("Sample table", { exact: true }).click();
  await page.getByLabel("Edit population for Alpha", { exact: true }).click();
  const editor = page.getByLabel("Edit Group ID for Alpha", { exact: true });
  await editor.fill("New Group");
  await editor.press("Enter");
  await expect(page.getByRole("alert")).toContainText("whitespace");
  await expect(editor).toBeVisible();
  await editor.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Sample Table & Data Editor" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr").first()).toContainText("Group_A");
});

test("live headings and point label sizes render, and first export inherits current settings", async ({
  page,
}) => {
  await page.goto("/");
  await upload(page);
  await page.getByLabel("Plot settings", { exact: true }).click();
  await page.getByLabel("Plot title", { exact: true }).fill("Study 2026");
  await page.getByLabel("Plot subtitle", { exact: true }).fill("Cohort A");
  await page.getByRole("tab", { name: "Markers", exact: true }).click();
  await page
    .getByLabel("Marker style", { exact: true })
    .selectOption("hollow-circles");
  await page.getByRole("tab", { name: "Labels", exact: true }).click();
  await page.getByLabel("Point labels", { exact: true }).selectOption("sample");
  await page.getByLabel("Point label font size", { exact: true }).fill("16");
  await page.keyboard.press("Escape");
  await expect(page.locator(".gtitle")).toContainText("Study 2026");
  await expect(page.locator(".gtitle")).toContainText("Cohort A");
  await expect(page.locator(".textpoint text").first()).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(page.locator(".textpoint text").first()).toHaveCSS(
    "fill-opacity",
    "1",
  );
  const plotHeight = await page
    .locator(".plot")
    .evaluate((el: any) => el._fullLayout.yaxis._length);
  await page.getByLabel("Export", { exact: true }).click();
  await expect(page.getByLabel("Export title", { exact: true })).toHaveValue(
    "Study 2026",
  );
  await expect(page.getByLabel("Export subtitle", { exact: true })).toHaveValue(
    "Cohort A",
  );
  const preview = page.getByAltText("PNG export preview");
  await expect(preview).toBeVisible();
  const exportedPlotHeight = await preview.evaluate(
    (el: HTMLImageElement) => JSON.parse(el.dataset.plotBox!).height,
  );
  expect(exportedPlotHeight).toBeCloseTo(plotHeight);
});
