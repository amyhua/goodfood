import { expect, test } from "@playwright/test";

test("health endpoint reports ok", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("dashboard renders the app name and progress", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nutrition meal planner" })).toBeVisible();
  await expect(page.getByText("Build progress")).toBeVisible();
});
