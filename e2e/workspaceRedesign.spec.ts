import { expect, test, type Page } from "@playwright/test";

async function load(page: Page, count = 4) {
  await page.goto("/");
  await page.getByTestId("file-input").setInputFiles({
    name: "regression.evec",
    mimeType: "text/plain",
    buffer: Buffer.from(
      Array.from(
        { length: count },
        (_, i) => `S${i} ${i / count} ${i % 3} A`,
      ).join("\n"),
    ),
  });
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.data?.length ?? 0),
    )
    .toBeGreaterThan(0);
}

test("percentage controls show human percentages and nested Escape closes only the palette", async ({
  page,
}) => {
  await load(page);
  await page.locator('[data-population="A"]').click({ button: "right" });
  const opacity = page.getByLabel("Point opacity", { exact: true });
  await expect(opacity).toHaveValue("100");
  await opacity.fill("25");
  await opacity.press("Tab");
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.data[0].marker.color),
    )
    .toEqual(Array(4).fill(expect.stringMatching(/,0\.25\)$/)));
  const color = page.getByRole("button", {
    name: "Open Population color palette",
    exact: true,
  });
  await color.click();
  await expect(
    page.getByRole("dialog", { name: "Population color palette" }),
  ).toBeVisible();
  const swatch = page.getByRole("button", {
    name: "Color #000000",
    exact: true,
  });
  await expect(swatch).toBeFocused();
  const bounds = await swatch.boundingBox();
  expect(bounds!.width).toBeGreaterThanOrEqual(24);
  expect(bounds!.height).toBeGreaterThanOrEqual(24);
  expect(Math.abs(bounds!.height - bounds!.width)).toBeLessThan(1);
  await page.keyboard.press("Tab");
  const nextSwatch = page.getByRole("button", {
    name: "Color #434343",
    exact: true,
  });
  await expect(nextSwatch).toBeFocused();
  expect(
    await nextSwatch.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Population color palette" }),
  ).toHaveCount(0);
  await expect(color).toBeFocused();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.data[0].marker.color),
    )
    .toEqual(Array(4).fill("rgba(67,67,67,0.25)"));
  await color.click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Population color palette" }),
  ).toHaveCount(0);
  await expect(opacity).toBeVisible();
  await expect(color).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opacity).toHaveCount(0);
});

test("export has legible header states and keyboard-navigable format tabs", async ({
  page,
}) => {
  await load(page);
  const trigger = page.getByRole("button", { name: "Export", exact: true });
  await expect(trigger).toHaveCSS("color", "rgb(28, 59, 45)");
  await trigger.hover();
  await expect(trigger).toHaveCSS("color", "rgb(28, 59, 45)");
  await trigger.focus();
  await expect(trigger).toHaveCSS("color", "rgb(28, 59, 45)");
  await trigger.click();
  const image = page.getByRole("tab", { name: "PNG Image", exact: true });
  await image.focus();
  await page.keyboard.press("ArrowRight");
  const csv = page.getByRole("tab", { name: "CSV Coordinates", exact: true });
  await expect(csv).toBeFocused();
  await expect(csv).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tabpanel", { name: "CSV Coordinates" }),
  ).toBeVisible();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Interactive Archive", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(image).toBeFocused();
  await expect(image).toHaveAttribute("aria-selected", "true");
});

test("editing a row preserves the current page and modal keyboard ownership", async ({
  page,
}) => {
  await load(page, 65);
  const trigger = page.getByRole("button", {
    name: "Sample table",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Sample Table & Data Editor",
  });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      page.locator("#root").evaluate((el) => (el as HTMLElement).inert),
    )
    .toBe(true);
  await page.getByLabel("Next page", { exact: true }).click();
  await page.getByLabel("Edit population for S50", { exact: true }).click();
  const input = page.getByLabel("Edit Group ID for S50", { exact: true });
  await input.fill("Edited");
  await input.press("Enter");
  await expect(dialog.getByText("2 / 2", { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole("row").filter({ hasText: "S50" }),
  ).toContainText("Edited");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect
    .poll(() =>
      page.locator("#root").evaluate((el) => (el as HTMLElement).inert),
    )
    .toBe(false);
  await expect(trigger).toBeFocused();
});

test("mobile starts with chart exposed and tools stay in one scrollable row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  await expect(
    page.getByRole("complementary", { name: "Population legend" }),
  ).toHaveCount(0);
  const tools = await page
    .locator(".plot-toolbar")
    .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  expect(tools.scroll).toBeGreaterThan(tools.width);
  await expect(page.locator(".plot-toolbar")).toHaveCSS("flex-wrap", "nowrap");
  await page
    .getByRole("button", { name: "Toggle legend", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Population legend" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("complementary", { name: "Population legend" }),
  ).toHaveCount(0);
});
