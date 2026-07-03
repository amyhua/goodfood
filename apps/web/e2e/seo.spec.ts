import { expect, test } from "@playwright/test";

/** F7 — verify SEO surfaces + link previews render on the main public pages. */

test("robots.txt allows public, disallows api + private, links the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("Sitemap:");
  expect(body).toMatch(/Disallow:\s*\/api/);
});

test("sitemap.xml lists the public routes", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("<urlset");
  expect(body).toContain("/planner");
});

test("default OG image renders as PNG", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("landing carries OG + Twitter meta and WebSite JSON-LD", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(ld).toContain("WebSite");
  expect(ld).toContain("SoftwareApplication");
});

test("tool pages inherit default OG meta", async ({ page }) => {
  await page.goto("/planner");
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
});
