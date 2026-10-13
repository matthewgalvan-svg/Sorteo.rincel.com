import { defineConfig, devices } from '@playwright/test'

// Dos servidores locales: modo demostración y modo "live" (con /api y Turnstile simulados en las pruebas).
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npx vite --port 5178 --strictPort --mode e2e-demo',
      url: 'http://localhost:5178',
      reuseExistingServer: false,
      env: { VITE_REGISTRATION_MODE: 'demo' },
    },
    {
      command: 'npx vite --port 5179 --strictPort --mode e2e-live',
      url: 'http://localhost:5179',
      reuseExistingServer: false,
      env: { VITE_REGISTRATION_MODE: 'live', VITE_TURNSTILE_SITE_KEY: 'e2e-site-key' },
    },
  ],
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 14'], browserName: 'chromium' } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
  ],
})
