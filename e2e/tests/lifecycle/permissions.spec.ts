/**
 * Permission validation scenario.
 *
 * Tests: Admin sees admin controls, non-admin member does not.
 * Setup: League created with denix as admin via API.
 */

import { test, expect } from '../fixtures.js';
import { StatusButtonPage } from '../page-objects/status-button.page.js';
import {
  createLeagueViaApi,
  loginAsUser,
} from '../helpers/api-helpers.js';
import { THREE_PLAYERS, USERS, PASSWORD, uniqueLeagueName } from '../helpers/test-data.js';
import { STORAGE_PATH } from '../../global-setup.js';

let leagueId: string;

test.describe('Permissions', () => {
  test.beforeAll(async ({ browser }) => {
    // Create league as denix (admin) with 3 players
    const ctx = await browser.newContext({ storageState: STORAGE_PATH });
    leagueId = await createLeagueViaApi(ctx, {
      title: uniqueLeagueName('permissions'),
      description: 'E2E permissions test',
      members: THREE_PLAYERS.map(p => ({ userId: p.userId, displayName: p.displayName })),
    });
    await ctx.close();
  });

  test('admin sees Start League and Edit League buttons', async ({ page, pageErrors }) => {
    // Denix is the default authenticated user (from global-setup)
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({ timeout: 15000 });

    // Admin should see both buttons
    await expect(page.getByRole('button', { name: /start league/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /edit league/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('non-admin member cannot see Start/Edit buttons', async ({ browser }) => {
    // Login as hansemann (non-admin member)
    const ctx = await loginAsUser(browser, USERS.hansemann.email, PASSWORD);
    const page = await ctx.newPage();

    await page.goto(`http://localhost:3000/leagues/${leagueId}/leaderboard`);
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({ timeout: 15000 });

    // Non-admin should NOT see admin controls
    await expect(page.getByRole('button', { name: /start league/i })).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /edit league/i })).not.toBeVisible({ timeout: 3000 });

    await page.close();
    await ctx.close();
  });

  test('non-admin can still view league content', async ({ browser }) => {
    // Login as hansemann
    const ctx = await loginAsUser(browser, USERS.hansemann.email, PASSWORD);
    const page = await ctx.newPage();

    await page.goto(`http://localhost:3000/leagues/${leagueId}/description`);

    // Should see league description content and status
    await expect(page.getByText(/planned/i)).toBeVisible({ timeout: 15000 });

    await page.close();
    await ctx.close();
  });
});
