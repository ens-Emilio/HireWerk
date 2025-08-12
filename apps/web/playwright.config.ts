import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const port = isCI ? 3000 : 3002;
const command = isCI ? `bun run start -p ${port}` : `bun run dev:webpack`;

export default defineConfig({
  testDir: "src/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command,
    port,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
