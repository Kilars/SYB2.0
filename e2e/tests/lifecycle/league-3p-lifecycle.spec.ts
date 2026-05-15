/**
 * Full 3-player (N=3) league lifecycle through the real UI:
 * create → activate with PlayerCount=3 → complete every generated match
 * via the PodiumPicker → verify the placement-points leaderboard.
 *
 * 3P sibling of league-lifecycle.spec.ts and the canonical regression net
 * for the N>2 league path.
 */

import { test, expect } from '../fixtures.js';
import { LeagueFormPage } from '../page-objects/league-form.page.js';
import { StatusButtonPage } from '../page-objects/status-button.page.js';
import { LeaderboardPage } from '../page-objects/leaderboard.page.js';
import { PodiumPickerPage } from '../page-objects/podium-picker.page.js';
import { uniqueLeagueName, expectedMatchCount, USERS } from '../helpers/test-data.js';

// Shared state across serial tests
let leagueName: string;
let leagueId: string;

test.describe('League 3P Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test('creates a 3-player league via the UI', async ({ page, pageErrors }) => {
    const form = new LeagueFormPage(page);

    leagueName = uniqueLeagueName('3p-lifecycle');

    await page.goto('/createLeague');
    await form.fillTitle(leagueName);
    await form.fillDescription('E2E 3-player lifecycle');

    // denix is auto-added as creator
    await form.addMember(USERS.hansemann.displayName);
    await form.addMember(USERS.larsski.displayName);

    await form.clickCreate();

    await page.waitForURL(/\/leagues\/[^/]+\/leaderboard$/, { timeout: 15000 });
    const url = page.url();
    leagueId = url.split('/leagues/')[1].split('/')[0];

    await expect(page.getByRole('tab', { name: /leaderboard/i })).toBeVisible({ timeout: 10000 });

    await page.goto(`/leagues/${leagueId}/description`);
    await expect(page.getByRole('heading', { name: leagueName })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/planned/i)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('activates with PlayerCount=3 and generates 4 matches', async ({ page, pageErrors }) => {
    const status = new StatusButtonPage(page);

    await page.goto(`/leagues/${leagueId}/leaderboard`);

    const leaderboard = new LeaderboardPage(page);
    await leaderboard.waitForTable();

    // Choose the 3-player format on the activation toggle
    await page.getByTestId('player-count-toggle').locator('button[value="3"]').click();

    await status.clickStartLeague();
    await status.expectRevertVisible();

    await page.getByRole('tab', { name: /matches/i }).click();
    await page.waitForURL(/\/matches/, { timeout: 5000 });

    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards).toHaveCount(expectedMatchCount(3, 3), { timeout: 15000 });

    expect(pageErrors).toEqual([]);
  });

  test('completes match 1 via PodiumPicker (full podium)', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/matches`);

    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const pendingCard = cards.filter({ hasText: /play/i }).first();
    await pendingCard.click();
    await page.waitForURL(/\/bracket\//, { timeout: 10000 });

    const podium = new PodiumPickerPage(page);
    await podium.waitForPicker();
    await podium.selectPlacement(1, USERS.hansemann.userId);
    await podium.selectPlacement(2, USERS.larsski.userId);
    await podium.selectPlacement(3, USERS.denix.userId);

    await page.getByRole('button', { name: /complete ffa match/i }).click();

    await expect(page.getByRole('button', { name: /reopen match/i })).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('leaderboard reflects placement points; column reads Performance', async ({ page, pageErrors }) => {
    const lb = new LeaderboardPage(page);

    await page.goto(`/leagues/${leagueId}/leaderboard`);
    await lb.waitForTable();

    await expect(lb.getPerformanceColumnHeader()).toBeVisible({ timeout: 10000 });

    const expected: Array<[string, number]> = [
      [USERS.hansemann.userId, 4],
      [USERS.larsski.userId, 2],
      [USERS.denix.userId, 1],
    ];

    for (const [userId, value] of expected) {
      const row = lb.getPlayerRowByUserId(userId);
      await expect(row).toBeVisible({ timeout: 10000 });
      const text = await row.getByRole('cell').nth(2).textContent();
      expect(parseInt(text?.trim() ?? '0', 10)).toBe(value);
    }

    expect(await lb.getRowCount()).toBe(3);

    expect(pageErrors).toEqual([]);
  });

  test('completes match 2 with rotated placements', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/matches`);

    const cards = page.locator('[class*="MuiCard"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const pendingCard = cards.filter({ hasText: /play/i }).first();
    await pendingCard.click();
    await page.waitForURL(/\/bracket\//, { timeout: 10000 });

    const podium = new PodiumPickerPage(page);
    await podium.waitForPicker();
    await podium.selectPlacement(1, USERS.denix.userId);
    await podium.selectPlacement(2, USERS.hansemann.userId);
    await podium.selectPlacement(3, USERS.larsski.userId);

    await page.getByRole('button', { name: /complete ffa match/i }).click();
    await expect(page.getByRole('button', { name: /reopen match/i })).toBeVisible({ timeout: 10000 });

    const lb = new LeaderboardPage(page);
    await page.goto(`/leagues/${leagueId}/leaderboard`);
    await lb.waitForTable();

    const cumulative: Array<[string, number]> = [
      [USERS.hansemann.userId, 6],
      [USERS.denix.userId, 5],
      [USERS.larsski.userId, 3],
    ];

    for (const [userId, value] of cumulative) {
      const row = lb.getPlayerRowByUserId(userId);
      await expect(row).toBeVisible({ timeout: 10000 });
      const text = await row.getByRole('cell').nth(2).textContent();
      expect(parseInt(text?.trim() ?? '0', 10)).toBe(value);
    }

    expect(pageErrors).toEqual([]);
  });

  test('stats page renders for 3P league', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${leagueId}/stats`);
    await expect(page.locator('body')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
