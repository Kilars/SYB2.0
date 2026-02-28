import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const FRONTEND_URL = 'http://localhost:3000';
const LEAGUE_ID = 'season-one-league-id';
const OUTPUT_DIR = path.resolve(__dirname, '../.docs/screenshots');

const TEST_CREDENTIALS = {
  email: 'denix@test.com',
  password: 'Pa$$w0rd',
};

const PAGES = [
  { name: 'leaderboard', path: `/leagues/${LEAGUE_ID}/leaderboard`, waitFor: 'table' },
  { name: 'stats', path: `/leagues/${LEAGUE_ID}/stats`, waitFor: 'table' },
  { name: 'profile', path: null as string | null, waitFor: 'h4' }, // path set after login
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshot(page: Page, name: string) {
  const filepath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  ensureDir(OUTPUT_DIR);

  // Suppress self-signed TLS errors for local .NET dev certs
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  console.log('Taking screenshots...\n');

  // --- Authenticate ---
  console.log('[auth] Logging in as denix@test.com...');
  const loginResponse = await page.request.post(
    `${FRONTEND_URL}/api/login?useCookies=true`,
    {
      data: TEST_CREDENTIALS,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!loginResponse.ok()) {
    throw new Error(`Login failed: HTTP ${loginResponse.status()}`);
  }
  console.log('[auth] Login succeeded\n');

  // --- Get user ID for profile page ---
  const userInfoResponse = await page.request.get(`${FRONTEND_URL}/api/account/user-info`);
  if (!userInfoResponse.ok()) {
    throw new Error(`Failed to fetch user info: HTTP ${userInfoResponse.status()}`);
  }
  const userInfo = await userInfoResponse.json();
  const userId = userInfo.id;
  console.log(`[auth] User ID: ${userId}\n`);

  // Set profile page path now that we have the user ID
  PAGES.find((p) => p.name === 'profile')!.path = `/user/${userId}`;

  // --- Take screenshots ---
  for (const pageInfo of PAGES) {
    console.log(`--- ${pageInfo.name} ---`);
    await page.goto(`${FRONTEND_URL}${pageInfo.path}`);
    await page.waitForSelector(pageInfo.waitFor, { timeout: 15000 });
    await page.waitForTimeout(500); // let animations settle
    await takeScreenshot(page, pageInfo.name);
    console.log('');
  }

  await browser.close();
  console.log('✅ Done! Screenshots saved to .docs/screenshots/');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
