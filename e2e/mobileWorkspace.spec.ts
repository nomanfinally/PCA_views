import { expect, test, type Page } from "@playwright/test";

test.use({ hasTouch: true });
async function load(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try an example dataset" }).tap();
  await expect
    .poll(() =>
      page.locator(".plot").evaluate((el: any) => el.data?.length ?? 0),
    )
    .toBeGreaterThan(0);
  await expect(page.getByText("Preparing plot…", { exact: true })).toHaveCount(
    0,
  );
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`${viewport.width}×${viewport.height}: chart keeps available height and every tool stays on the scroll strip`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await load(page);
    const chart = await page.locator(".plot").boundingBox();
    expect(chart!.height).toBeGreaterThanOrEqual(viewport.height - 172);
    await expect(
      page.getByRole("complementary", { name: "Population legend" }),
    ).toHaveCount(0);
    const toolbar = page.getByRole("toolbar", { name: "Plot tools" });
    const box = await toolbar.boundingBox();
    const buttons = toolbar.getByRole("button");
    expect(await buttons.count()).toBeGreaterThan(20);
    for (const button of await buttons.all()) {
      const rect = await button.boundingBox();
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      expect(rect!.width).toBeGreaterThanOrEqual(44);
      expect(rect!.y).toBeGreaterThanOrEqual(box!.y);
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(box!.y + box!.height);
    }
    await toolbar
      .getByRole("button", { name: "Toggle regression lines", exact: true })
      .tap();
    await expect(
      toolbar.getByRole("button", {
        name: "Toggle regression lines",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect((await page.locator(".plot").boundingBox())!.height).toBeCloseTo(
      chart!.height,
      0,
    );
    await toolbar
      .getByRole("button", { name: "Pan mode", exact: true })
      .focus();
    await page.keyboard.press("End");
    await expect(
      toolbar.getByRole("button", { name: "Fullscreen", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Home");
    await expect(
      toolbar.getByRole("button", { name: "Pan mode", exact: true }),
    ).toBeFocused();
    expect(await toolbar.evaluate((el) => el.scrollLeft)).toBeLessThan(10);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  });
}

test("touch swiping reveals tools without activating them, and scrolled search/settings stay usable", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  const toolbar = page.getByRole("toolbar", { name: "Plot tools" });
  const box = await toolbar.boundingBox();
  const cdp = await context.newCDPSession(page);
  const point = (x: number) => ({ x, y: box!.y + box!.height / 2 });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(340)],
  });
  for (const x of [300, 250, 200, 150, 100, 60]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(x)],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => toolbar.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(150);
  await expect(
    toolbar.getByRole("button", { name: "Pan mode", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    toolbar.getByRole("button", { name: "Toggle grid", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const grid = toolbar.getByRole("button", {
    name: "Toggle grid",
    exact: true,
  });
  await grid.tap();
  await expect(grid).toHaveAttribute("aria-pressed", "false");
  const search = page.getByLabel("Search samples", { exact: true });
  await search.scrollIntoViewIfNeeded();
  await search.fill("DEMO_001");
  await expect
    .poll(() =>
      page
        .locator(".plot")
        .evaluate((el: any) =>
          el.data.reduce(
            (sum: number, t: any) => sum + (t.customdata?.length ?? 0),
            0,
          ),
        ),
    )
    .toBe(1);
  await page.getByLabel("Clear sample search", { exact: true }).tap();
  await page.getByRole("button", { name: "Plot settings", exact: true }).tap();
  await expect(
    page.getByRole("dialog", { name: "Plot settings", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const appearance = page.locator("details.advanced-tools");
  await expect(appearance).toHaveCount(1);
  expect(await appearance.evaluate((el: HTMLDetailsElement) => el.open)).toBe(
    false,
  );
  await appearance.locator("summary").click();
  await expect(grid).toBeVisible();
});
