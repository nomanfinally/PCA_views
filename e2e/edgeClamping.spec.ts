import { test, expect } from "@playwright/test";

test.describe("Toolbar cleanup & group label edge clamping", () => {
  test("removes connector & visible grid icons from toolbar, verifies default settings and edge-clamping on zoom", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify toolbar cleanliness on example load
    await page.getByRole("button", { name: /Try an example dataset/i }).click();
    await expect
      .poll(() =>
        page.locator(".plot").evaluate((el: any) => el.data?.length ?? 0),
      )
      .toBeGreaterThan(0);
    await expect(page.getByText("Preparing plot…")).toHaveCount(0);

    // Verify removed toolbar buttons are absent from visible toolbar
    await expect(
      page.getByLabel("Toggle label centroid connectors"),
    ).toHaveCount(0);
    // Grid icon button is absent from visible toolbar (only hidden test helper exists)
    const visibleGridIcon = page.locator(
      ".plot-toolbar .icon-button svg.lucide-grid-2x2",
    );
    await expect(visibleGridIcon).toHaveCount(0);

    // 2. Verify Settings dialog controls
    await page.getByLabel("Plot settings", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Plot settings" });
    await expect(dialog).toBeVisible();

    // Chart tab has "Show grid lines"
    await expect(page.getByLabel("Show grid lines")).toBeVisible();
    await expect(page.getByLabel("Show grid lines")).toBeChecked();

    // Labels tab has "Connect labels to centroids" and "Stick offscreen group labels to edge"
    await page.getByRole("tab", { name: "Labels" }).click();
    const connectorCheckbox = page.getByLabel("Connect labels to centroids");
    await expect(connectorCheckbox).toBeVisible();
    await expect(connectorCheckbox).toBeChecked(); // ON by default

    const edgeCheckbox = page.getByLabel(
      "Stick offscreen group labels to edge",
    );
    await expect(edgeCheckbox).toBeVisible();
    await expect(edgeCheckbox).toBeChecked(); // ON by default

    // Turn ON group labels
    await page.getByLabel("Population labels", { exact: true }).check();
    await page.getByLabel("Close settings", { exact: true }).click();

    // Verify group labels are rendered on the plot
    await expect(
      page.locator(".annotation").filter({ hasText: "Group_A" }),
    ).toBeVisible();
    await expect(
      page.locator(".annotation").filter({ hasText: "Group_D" }),
    ).toBeVisible();

    // Capture initial centroids
    const initialAnnotations = await page.locator(".plot").evaluate((el: any) =>
      el.layout.annotations.map((a: any) => ({
        text: a.text,
        x: a.x,
        y: a.y,
        ax: a.ax,
        ay: a.ay,
      })),
    );
    const initialGroupD = initialAnnotations.find(
      (a: any) => a.text === "Group_D",
    );
    expect(initialGroupD).toBeDefined();

    // 3. Zoom heavily into Group_A so Group_D's centroid falls outside the visible viewport
    const groupABox = (await page
      .locator(".annotation")
      .filter({ hasText: "Group_A" })
      .boundingBox())!;
    await page.mouse.move(
      groupABox.x + groupABox.width / 2,
      groupABox.y + groupABox.height / 2,
    );
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -60);
    }

    await page.waitForTimeout(600);

    const zoomedRanges = await page.locator(".plot").evaluate((el: any) => ({
      xRange: el._fullLayout.xaxis.range,
      yRange: el._fullLayout.yaxis.range,
      annotations: el.layout.annotations.map((a: any) => ({
        text: a.text,
        x: a.x,
        y: a.y,
      })),
    }));

    const minX = Math.min(zoomedRanges.xRange[0], zoomedRanges.xRange[1]);
    const maxX = Math.max(zoomedRanges.xRange[0], zoomedRanges.xRange[1]);
    const minY = Math.min(zoomedRanges.yRange[0], zoomedRanges.yRange[1]);
    const maxY = Math.max(zoomedRanges.yRange[0], zoomedRanges.yRange[1]);

    const isOriginalGroupDOffscreen =
      initialGroupD.x < minX ||
      initialGroupD.x > maxX ||
      initialGroupD.y < minY ||
      initialGroupD.y > maxY;

    expect(isOriginalGroupDOffscreen).toBe(true);

    // With clampGroupLabelsToEdge ON (default), Group_D's label should STICK TO EDGE and be visible!
    const clampedGroupD = zoomedRanges.annotations.find(
      (a: any) => a.text === "Group_D",
    );
    expect(clampedGroupD).toBeDefined();
    expect(clampedGroupD.x).toBeGreaterThanOrEqual(minX);
    expect(clampedGroupD.x).toBeLessThanOrEqual(maxX);
    expect(clampedGroupD.y).toBeGreaterThanOrEqual(minY);
    expect(clampedGroupD.y).toBeLessThanOrEqual(maxY);

    // 4. Now turn clampGroupLabelsToEdge OFF in Settings
    await page.getByLabel("Plot settings", { exact: true }).click();
    await page.getByRole("tab", { name: "Labels" }).click();
    await page.getByLabel("Stick offscreen group labels to edge").uncheck();
    await page.getByLabel("Close settings", { exact: true }).click();

    // Group_D annotation's anchor should now be at the raw un-clamped centroid
    const unclampedGroupD = await page.locator(".plot").evaluate((el: any) => {
      const b = el.layout.annotations.find((a: any) => a.text === "Group_D");
      return b ? { x: b.x, y: b.y } : null;
    });

    expect(unclampedGroupD).toBeDefined();
    expect(unclampedGroupD!.x).toBeCloseTo(initialGroupD.x, 3);
    expect(unclampedGroupD!.y).toBeCloseTo(initialGroupD.y, 3);
  });
});
