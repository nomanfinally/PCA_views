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

test.describe("Sample Table & Exclusion & Dynamic Group Creation", () => {
  test("shows elevated toolbar button, allows unplotting and editing group ID", async ({
    page,
  }) => {
    await load(page);

    // 1. Verify elevated toolbar button is present with correct label and initial count
    const tableBtn = page.getByLabel("Sample table", { exact: true });
    await expect(tableBtn).toBeVisible();
    await expect(tableBtn).toContainText("Samples Table");
    await expect(tableBtn).toContainText("4 plotted");

    // 2. Open Samples Table dialog
    await tableBtn.click();
    const tableModal = page.locator(".table-modal");
    await expect(tableModal).toBeVisible();
    await expect(tableModal).toContainText("Sample Table & Data Editor");

    // Check rows are present
    const rows = tableModal.locator("tbody tr");
    await expect(rows).toHaveCount(4);

    // Check columns: Plot Status, Sample ID (IID), Group ID (FID), PC1, PC2, Mark
    await expect(tableModal.locator("th").nth(0)).toContainText("Plot Status");
    await expect(tableModal.locator("th").nth(1)).toContainText(
      "Sample ID (IID)",
    );
    await expect(tableModal.locator("th").nth(2)).toContainText(
      "Group ID (FID)",
    );

    // 3. Unplot Alpha (row 0)
    const unplotAlphaBtn = page.getByRole("button", {
      name: "Unplot Alpha",
      exact: true,
    });
    await expect(unplotAlphaBtn).toBeVisible();
    await unplotAlphaBtn.click();

    // Verify status changed to Excluded
    await expect(
      page.getByRole("button", { name: "Plot Alpha", exact: true }),
    ).toBeVisible();

    // Verify elevated toolbar button now shows unplotted count
    await expect(tableBtn).toContainText("3 plotted");
    await expect(tableBtn).toContainText("1 unplotted");

    // 4. Change group ID of Beta from Group_B to Group_B_outlier
    const editBetaBtn = page.getByRole("button", {
      name: "Edit population for Beta",
      exact: true,
    });
    await expect(editBetaBtn).toBeVisible();
    await editBetaBtn.click();

    const inputPop = page.getByLabel("Edit Group ID for Beta");
    await expect(inputPop).toBeVisible();
    await inputPop.fill("Group_B_outlier");
    await page.keyboard.press("Enter");

    // Verify Beta now shows Group_B_outlier and 'edited' badge
    await expect(rows.nth(1)).toContainText("Group_B_outlier");
    await expect(rows.nth(1)).toContainText("edited");

    // Close the table modal using the close dialog button
    await page.getByLabel("Close dialog", { exact: true }).click();
    await expect(tableModal).not.toBeVisible();

    // 5. Verify the new group dynamically appears in the legend
    const legend = page.locator(".legend-dock");
    await expect(legend).toBeVisible();
    await expect(legend).toContainText("Group_B_outlier");

    // 6. Test Point Inspector: selecting Gamma from table opens inspector
    await tableBtn.click();
    await page.getByRole("button", { name: "Gamma", exact: true }).click();

    const inspector = page.locator(".point-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText("Gamma");
    await expect(inspector).toContainText("Group_A");

    // Inspector has "Unplot sample (exclude)" button
    const unplotBtn = page.getByRole("button", {
      name: "Unplot sample",
      exact: true,
    });
    await expect(unplotBtn).toBeVisible();
    await unplotBtn.click();

    // Verify unplot button toggles to "Include in plot"
    await expect(
      page.getByRole("button", { name: "Include sample in plot", exact: true }),
    ).toBeVisible();

    // Toolbar count should now show 2 unplotted
    await expect(tableBtn).toContainText("2 unplotted");

    // 7. Test Export CSV from table dialog
    await page.keyboard.press("Escape"); // Close inspector
    await tableBtn.click();
    await expect(tableModal).toBeVisible();

    const exportCsvBtn = page.getByRole("button", {
      name: "Export CSV",
      exact: true,
    });
    await expect(exportCsvBtn).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await exportCsvBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".csv");
  });
});
