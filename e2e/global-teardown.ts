/**
 * Global Teardown for SYB2.0 E2E Tests
 *
 * Runs once after all tests to clean up test-created leagues.
 * Preserves the seeded league (season-one-league-id).
 */

import { chromium, FullConfig } from '@playwright/test';
import { STORAGE_PATH } from './global-setup';

const FRONTEND_URL = 'http://localhost:3000';
const SEED_LEAGUE_ID = 'season-one-league-id';

async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log('[global-teardown] Starting test cleanup...');

  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: FRONTEND_URL,
    storageState: STORAGE_PATH,
    ignoreHTTPSErrors: true,
  });

  try {
    // Fetch all leagues
    const res = await context.request.get(`${FRONTEND_URL}/api/leagues`);
    if (!res.ok()) {
      console.warn(`[global-teardown] Could not fetch leagues: ${res.status()}`);
      return;
    }

    const leagues: { id: string; title: string }[] = await res.json();
    const testLeagues = leagues.filter((l) => l.id !== SEED_LEAGUE_ID);

    if (testLeagues.length === 0) {
      console.log('[global-teardown] No test leagues to clean up');
      return;
    }

    console.log(`[global-teardown] Found ${testLeagues.length} test league(s) to delete`);

    for (const league of testLeagues) {
      try {
        const delRes = await context.request.delete(
          `${FRONTEND_URL}/api/leagues/${league.id}`
        );
        if (delRes.ok()) {
          console.log(`[global-teardown] Deleted: "${league.title}" (${league.id})`);
        } else {
          console.warn(
            `[global-teardown] Failed to delete "${league.title}": ${delRes.status()}`
          );
        }
      } catch (err) {
        console.warn(`[global-teardown] Error deleting "${league.title}":`, err);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('[global-teardown] Cleanup complete');
}

export default globalTeardown;
