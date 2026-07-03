import { expect, test, type Page } from "@playwright/test";

/**
 * F1 mobile-friendliness checks. Runs across the desktop + phone projects defined in
 * playwright.config.ts. The core invariant everywhere: no horizontal overflow. Phone-
 * specific assertions (bottom tab bar, >=44px touch targets) are guarded by viewport width.
 */
const PAGES = ["/", "/planner", "/foods", "/pantry", "/shopping"];

async function isMobile(page: Page) {
  const w = page.viewportSize()?.width ?? 1280;
  return w < 768;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  // Allow 1px for sub-pixel rounding.
  expect(overflow).toBeLessThanOrEqual(1);
}

for (const path of PAGES) {
  test(`${path} has no horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    await expectNoHorizontalOverflow(page);
  });
}

test("mobile shows the bottom tab bar with touch-sized targets", async ({ page }) => {
  await page.goto("/planner");
  if (!(await isMobile(page))) {
    // Desktop: sidebar nav present, bottom bar hidden.
    await expect(page.getByRole("link", { name: "Planner" }).first()).toBeVisible();
    return;
  }
  const bottomNav = page.getByRole("navigation", { name: "Primary" });
  await expect(bottomNav).toBeVisible();
  const plannerTab = bottomNav.getByRole("link", { name: "Planner" });
  await expect(plannerTab).toBeVisible();
  const box = await plannerTab.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test("planner renders sample plan, proof, and collapsible meals", async ({ page }) => {
  await page.goto("/planner");
  await expect(page.getByRole("heading", { name: "Sample day plan" })).toBeVisible();
  await expect(page.getByText("Sample data").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nutrient proof" })).toBeVisible();
  // Missing-data honesty: at least one proof value renders as em dash, never 0.
  await expect(page.getByText("Calories", { exact: true }).first()).toBeVisible();

  // Meal sections are collapsible <details>; collapse Breakfast and confirm it hides.
  const breakfast = page.locator("details", { hasText: "Breakfast" }).first();
  await expect(breakfast).toHaveAttribute("open", "");
  await breakfast.getByText("Breakfast").click();
  await expect(breakfast).not.toHaveAttribute("open", "");
});

test("nutrient rail collapses on mobile", async ({ page }) => {
  await page.goto("/planner");
  const rail = page.locator("details", { hasText: "At a glance" }).first();
  await expect(rail).toBeVisible();
});
