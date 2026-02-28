import { defineConfig, devices } from '@playwright/test';

// Storage state path for cached auth (relative to this config file)
const STORAGE_STATE = './storage/auth-state.json';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false, // Sequential — tests share seeded DB state
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries — tests should be deterministic
  workers: 1,
  timeout: 120000, // 2 minutes per test

  reporter: [
    ['html', { outputFolder: '../playwright-report' }],
    ['list'],
  ],

  // Global setup: authenticate once and cache storage state
  globalSetup: './global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Use cached cookie auth state for all tests (overridable per-test)
    storageState: STORAGE_STATE,
    // Ignore HTTPS certificate errors for local dev backend on port 5002
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /sanity\.spec\.ts/,
    },
    {
      name: 'full',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /sanity\.spec\.ts/, // Sanity tests run in smoke project only
    },
  ],

  webServer: [
    {
      // Backend: .NET API on HTTPS port 5002
      command: 'dotnet run --project API',
      url: 'https://localhost:5002/api/leagues',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
      timeout: 120000, // Allow time for .NET build + EF seeding
      stdout: 'pipe',
      stderr: 'pipe',
      ignoreHTTPSErrors: true,
    },
    {
      // Frontend: Vite dev server on port 3000
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: '../client',
      timeout: 30000,
      stdout: 'ignore',
    },
  ],
});
