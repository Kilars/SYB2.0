/**
 * Global Setup for SYB2.0 E2E Tests
 *
 * Runs once before all tests to:
 * 1. Wait for backend to be fully ready (health-check via GET /api/leagues)
 * 2. Authenticate as the seeded test user (denix@test.com) via cookie auth
 * 3. Save browser storage/cookie state for reuse across all tests
 *
 * All tests then reuse this authenticated state, avoiding repeated logins
 * and keeping the test suite fast and deterministic.
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export const STORAGE_PATH = path.join(__dirname, 'storage', 'auth-state.json');

const BACKEND_URL = 'https://localhost:5002';
const FRONTEND_URL = 'http://localhost:3000';

const TEST_CREDENTIALS = {
  email: 'denix@test.com',
  password: 'Pa$$w0rd',
};

/**
 * Poll GET /api/leagues until the backend returns 200.
 * This endpoint is AllowAnonymous so it works without auth,
 * and it exercises the DB connection (seed data required).
 */
async function waitForBackendReady(timeout = 90000): Promise<void> {
  const healthUrl = `${BACKEND_URL}/api/leagues`;
  const deadline = Date.now() + timeout;

  console.log(`[global-setup] Waiting for backend at ${healthUrl}...`);

  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl, {
        // Node fetch doesn't verify TLS by default in older versions;
        // for local dev self-signed certs we suppress via env NODE_TLS_REJECT_UNAUTHORIZED=0
      });
      if (response.ok) {
        console.log('[global-setup] Backend ready');
        return;
      }
    } catch {
      // Backend not up yet — retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Backend not ready after ${timeout}ms`);
}

/**
 * Authenticate via POST /api/login?useCookies=true through the Vite proxy.
 * Vite proxies /api/* to https://localhost:5002, so the cookie is set
 * on the localhost:3000 origin (same as the frontend), enabling
 * seamless cookie auth for all subsequent page navigations.
 */
async function performLogin(): Promise<void> {
  console.log('[global-setup] Starting authentication...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: FRONTEND_URL,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    // Authenticate via API (through Vite proxy so cookie lands on port 3000 origin)
    const loginUrl = `${FRONTEND_URL}/api/login?useCookies=true`;
    const loginResponse = await page.request.post(loginUrl, {
      data: TEST_CREDENTIALS,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!loginResponse.ok()) {
      const body = await loginResponse.text();
      throw new Error(
        `Login failed: HTTP ${loginResponse.status()} — ${body}`
      );
    }

    console.log('[global-setup] Login API call succeeded');

    // Navigate to a page to confirm auth works (cookies are now in context)
    await page.goto('/leagues');

    // League list is public — confirm the page renders with content
    await page.waitForSelector('h2', { timeout: 15000 });
    console.log('[global-setup] Frontend navigation confirmed');

    // Ensure storage directory exists
    const storageDir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Save cookies + localStorage so all tests start authenticated
    await context.storageState({ path: STORAGE_PATH });
    console.log(`[global-setup] Auth state saved to ${STORAGE_PATH}`);
  } finally {
    await browser.close();
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('[global-setup] Starting SYB2.0 E2E test setup...');

  // Suppress self-signed TLS errors for local .NET dev certs
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

  await waitForBackendReady();
  await performLogin();

  console.log('[global-setup] Setup complete — tests will run with cached auth state');
}

export default globalSetup;
