/**
 * Cancel & Regenerate scenario.
 *
 * Tests: Start league → complete 1 match → cancel (revert to planning) → restart
 * Verifies: matches deleted on cancel, regenerated on restart, no old results remain.
 *
 * Setup: League created + started + 1 match completed via API.
 */

import { test, expect } from '../fixtures.js';
import { StatusButtonPage } from '../page-objects/status-button.page.js';
import {
  createLeagueViaApi,
  changeStatusViaApi,
  getMatchViaApi,
  completeMatchViaApi,
} from '../helpers/api-helpers.js';
import { THREE_PLAYERS, CHARACTERS, uniqueLeagueName } from '../helpers/test-data.js';
import { STORAGE_PATH } from '../../global-setup.js';

let leagueId: string;

test.describe('Cancel & Regenerate', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: STORAGE_PATH });

    // Create league with 3 players
    leagueId = await createLeagueViaApi(ctx, {
      title: uniqueLeagueName('cancel-regen'),
      description: 'E2E cancel-regenerate test',
      members: THREE_PLAYERS.map(p => ({ userId: p.userId, displayName: p.displayName })),
    });

    // Start league (Planned → Active)
    await changeStatusViaApi(ctx, leagueId, 1);

    // Complete match 1 (2-0 flawless)
    const match = await getMatchViaApi(ctx, leagueId, 1, 1);
    const rounds = match.rounds.map((r, i) => ({
      ...r,
      winnerUserId: i < 2 ? match.playerOne.userId : undefined,
      playerOneCharacterId: i === 0 ? CHARACTERS.wolf.id : i === 1 ? CHARACTERS.yoshi.id : undefined,
      playerTwoCharacterId: i === 0 ? CHARACTERS.zelda.id : i === 1 ? CHARACTERS.wario.id : undefined,
    }));
    await completeMatchViaApi(ctx, leagueId, 1, 1, rounds);

    await ctx.close();
  });

  test('active league has 6 matches with 1 completed', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/matches`);

    // Wait for match cards to render
    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    await expect(cards).toHaveCount(6);

    // At least one "Change" button (completed match)
    await expect(page.getByRole('button', { name: /change/i }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('cancel league deletes all matches', async ({ page, pageErrors }) => {
    const status = new StatusButtonPage(page);

    // Go to leaderboard tab where admin controls are
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({ timeout: 15000 });

    // Click "Set league to planning phase"
    await status.clickRevertToPlanning();
    await status.confirmDeletion();

    // Wait for status to change — "Start league" button should appear
    await status.expectStartLeagueVisible();

    // Navigate to matches tab — should show empty state
    await page.getByRole('tab', { name: /matches/i }).click();
    await page.waitForURL(/\/matches/, { timeout: 5000 });

    await expect(page.getByText(/no matches/i)).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('restart generates fresh 6 matches', async ({ page, pageErrors }) => {
    const status = new StatusButtonPage(page);

    // Go to leaderboard tab
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({ timeout: 15000 });

    // Start league again
    await status.clickStartLeague();
    await status.expectRevertVisible();

    // Navigate to matches tab
    await page.getByRole('tab', { name: /matches/i }).click();
    await page.waitForURL(/\/matches/, { timeout: 5000 });

    // 3 players → n*(n-1) = 3*2 = 6 matches (regenerated)
    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    await expect(cards).toHaveCount(6);

    expect(pageErrors).toEqual([]);
  });

  test('no old results remain after restart', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/matches`);

    // Wait for match cards
    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    // All matches should show "Register" (none completed)
    const registerButtons = page.getByRole('button', { name: /register/i });
    const changeButtons = page.getByRole('button', { name: /change/i });

    await expect(registerButtons.first()).toBeVisible();
    expect(await changeButtons.count()).toBe(0);

    expect(pageErrors).toEqual([]);
  });
});
