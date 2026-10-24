import type { Page } from "@playwright/test";
export async function showAppearance(page: Page) {
  const panel = page.locator("details.advanced-tools");
  if ((await panel.count()) === 0) return;
  if (!(await panel.evaluate((el: HTMLDetailsElement) => el.open)))
    await panel.locator("summary").click();
}
export async function appearanceAction(
  page: Page,
  options: { name: string | RegExp; exact?: boolean },
) {
  await showAppearance(page);
  await page.getByRole("button", options).click();
}
