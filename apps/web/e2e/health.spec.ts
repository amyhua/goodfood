import { expect, test } from "@playwright/test";

test("health endpoint reports ok", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("landing shows the pitch, free/open-source, and a GitHub contribute link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Meal plans you can actually trust/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Free, and open source/i })).toBeVisible();
  const gh = page.getByRole("link", { name: /Contribute on GitHub/i });
  await expect(gh).toBeVisible();
  await expect(gh).toHaveAttribute("href", "https://github.com/amyhua/goodfood");
  await expect(page.getByRole("link", { name: "Open the planner" })).toBeVisible();
});
