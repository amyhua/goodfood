import { defineConfig } from "vitest/config";

/** Shared Vitest defaults. Packages extend via mergeConfig or import options. */
export const baseTestConfig = defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    coverage: { provider: "v8", reporter: ["text"] },
  },
});

export default baseTestConfig;
