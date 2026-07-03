import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Phone viewports for the F1 mobile-friendliness checks.
    { name: "iphone-12", use: { ...devices["iPhone 12"] } },
    { name: "pixel-5", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
