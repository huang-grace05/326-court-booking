import { defineConfig } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3100";
const mongoUri =
  process.env.E2E_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/court-booking-e2e";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "e2e",
      PORT: port,
      MONGODB_URI: mongoUri,
      SESSION_SECRET: "e2e-only-session-secret-not-for-production",
    },
  },
});
