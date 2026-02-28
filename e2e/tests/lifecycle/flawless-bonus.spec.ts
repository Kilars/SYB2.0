/**
 * Flawless bonus recalculation scenario.
 *
 * Tests: Register 2-1 match (no bonus) → Reopen → Re-register as 2-0 (flawless bonus)
 * Verifies points change from 4 → 5 and persist after reload.
 *
 * Setup: League created and started via API for speed.
 */

import { test, expect } from '../fixtures.js';
import { MatchFormPage } from '../page-objects/match-form.page.js';
import { LeaderboardPage } from '../page-objects/leaderboard.page.js';
import {
  createLeagueViaApi,
  changeStatusViaApi,
  getMatchViaApi,
} from '../helpers/api-helpers.js';
import { THREE_PLAYERS, CHARACTERS, uniqueLeagueName } from '../helpers/test-data.js';
import { STORAGE_PATH } from '../../global-setup.js';

let leagueId: string;
let matchUrl: string;
let winnerName: string;

test.describe('Flawless Bonus Recalculation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: STORAGE_PATH });
    const title = uniqueLeagueName('flawless');
    leagueId = await createLeagueViaApi(ctx, {
      title,
      description: 'E2E flawless bonus test',
      members: THREE_PLAYERS.map(p => ({ userId: p.userId, displayName: p.displayName })),
    });
    await changeStatusViaApi(ctx, leagueId, 1);

    // Get match 1 to find the match URL and player names
    const match = await getMatchViaApi(ctx, leagueId, 1, 1);
    matchUrl = `/leagues/${leagueId}/split/1/match/1`;
    winnerName = match.playerOne.displayName;

    await ctx.close();
  });

  test('register 2-1 match — no flawless bonus', async ({ page, pageErrors }) => {
    const matchForm = new MatchFormPage(page);

    await page.goto(matchUrl);
    await matchForm.waitForForm();

    // 2-1 result: P1 wins R1, P2 wins R2, P1 wins R3
    await matchForm.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchForm.fillRound(2, CHARACTERS.wolf.fullName, CHARACTERS.sora.fullName, 'p2');
    await matchForm.fillRound(3, CHARACTERS.yoshi.fullName, CHARACTERS.wario.fullName, 'p1');

    await matchForm.clickComplete();
    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });

    // Check leaderboard: winner should have 4 points, 0 flawless
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    const leaderboard = new LeaderboardPage(page);
    await leaderboard.waitForTable();

    const stats = await leaderboard.getPlayerRow(winnerName);
    expect(stats.points).toBe(4);
    expect(stats.flawless).toBe(0);

    expect(pageErrors).toEqual([]);
  });

  test('reopen match', async ({ page, pageErrors }) => {
    await page.goto(matchUrl);

    // Match is completed — should show MatchDetailsView with "Reopen match" button
    await expect(
      page.getByRole('button', { name: /reopen match/i })
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /reopen match/i }).click();

    // After reopening, the form should reappear
    await expect(
      page.getByRole('heading', { name: /register match result/i })
    ).toBeVisible({ timeout: 15000 });

    expect(pageErrors).toEqual([]);
  });

  test('re-register as 2-0 — flawless bonus applied', async ({ page, pageErrors }) => {
    const matchForm = new MatchFormPage(page);

    await page.goto(matchUrl);
    await matchForm.waitForForm();

    // Clear round 3 first — after reopening, old round data (from the 2-1) persists
    await matchForm.clearRound(3);

    // 2-0 result: P1 wins both rounds
    await matchForm.fillRound(1, CHARACTERS.wolf.fullName, CHARACTERS.yoshi.fullName, 'p1');
    await matchForm.fillRound(2, CHARACTERS.yoshi.fullName, CHARACTERS.wolf.fullName, 'p1');

    await matchForm.clickComplete();
    await expect(page.getByText(/succes/i)).toBeVisible({ timeout: 10000 });

    // Check leaderboard: winner should have 5 points, 1 flawless
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    const leaderboard = new LeaderboardPage(page);
    await leaderboard.waitForTable();

    const stats = await leaderboard.getPlayerRow(winnerName);
    expect(stats.points).toBe(5);
    expect(stats.flawless).toBe(1);

    expect(pageErrors).toEqual([]);
  });

  test('reload page — data persists', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    const leaderboard = new LeaderboardPage(page);
    await leaderboard.waitForTable();

    await page.reload();
    await leaderboard.waitForTable();

    const stats = await leaderboard.getPlayerRow(winnerName);
    expect(stats.points).toBe(5);
    expect(stats.flawless).toBe(1);

    expect(pageErrors).toEqual([]);
  });
});
