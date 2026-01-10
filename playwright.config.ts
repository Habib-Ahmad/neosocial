import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:8080',

    trace: 'on-first-retry',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
