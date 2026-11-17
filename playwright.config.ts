// End-to-end tests: a production build of the app on a throwaway PGlite database, driven through Chromium.
// Run: npm run e2e. Rules for what belongs here: e2e/README.md.
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { ADMIN, PORT } from "./e2e/env";

export default defineConfig({
  testDir: "e2e",
  // One database and one server: files run in name order and later ones build on earlier data.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    // "Today" comes from the browser's time zone (tz cookie); pin it so the tests and the server agree.
    timezoneId: "UTC",
    colorScheme: "light",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `rm -rf .data/e2e && npx tsx scripts/db-setup.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      PGLITE_DIR: path.resolve(".data/e2e"),
      AUTH_SECRET: "e2e-only-secret-e2e-only-secret-e2e-only-secret",
      ADMIN_EMAIL: ADMIN.email,
      ADMIN_PASSWORD: ADMIN.password,
      ADMIN_NAME: ADMIN.name,
      // Local stores only: SOP from ./content, no GitHub, no hosted database, no AI calls.
      GITHUB_TOKEN: "",
      DATABASE_URL: "",
      AI_PROVIDER: "none",
      APP_TIME_ZONE: "UTC",
    },
  },
});
