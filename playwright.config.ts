import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  expect: { timeout: 30000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3010",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
