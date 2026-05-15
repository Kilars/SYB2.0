/**
 * League navigation tests.
 *
 * Four focused tests:
 *  1. League list shows seeded league with member count and View → detail navigation.
 *  2. Tab navigation: Description → Matches → Stats sequentially (replaces 4 atomic tab tests).
 *  3. Leaderboard structure: expected columns + 12 player rows (1 header + 12 = 13).
 *  4. Leaderboard data: Denix appears, Members section renders.
 */

import { test, expect, SEEDED_LEAGUE } from './fixtures.js';

test.describe('League list', () => {
  test('list shows seeded league with member count, View navigates to detail', async ({
    page,
    pageErrors,
  }) => {
    await page.goto('/leagues');

    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(SEEDED_LEAGUE.title)).toBeVisible({ timeout: 10000 });

    const seededCard = page.locator('[class*="MuiCard"]').filter({ hasText: SEEDED_LEAGUE.title });

    // 12 members are seeded — count should appear on the card
    await expect(seededCard.getByText('12')).toBeVisible({ timeout: 10000 });

    // View button navigates to league detail
    await seededCard.getByRole('button', { name: /view/i }).click();
    await expect(page).toHaveURL(new RegExp(`leagues/${SEEDED_LEAGUE.id}`), { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });
});

test.describe('League detail tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/leagues/${SEEDED_LEAGUE.id}/leaderboard`);
    await expect(page.getByRole('heading', { name: SEEDED_LEAGUE.title })).toBeVisible({
      timeout: 15000,
    });
  });

  test('clicking Description, Matches, Stats tabs in sequence updates the URL', async ({
    page,
    pageErrors,
  }) => {
    // Leaderboard is the active tab on entry
    const leaderboardTab = page.getByRole('tab', { name: /leaderboard/i });
    await expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: /description/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/description`),
      { timeout: 8000 },
    );

    await page.getByRole('tab', { name: /matches/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/matches`),
      { timeout: 8000 },
    );

    await page.getByRole('tab', { name: /stats/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/stats`),
      { timeout: 8000 },
    );

    expect(pageErrors).toEqual([]);
  });
});

test.describe('Leaderboard data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/leagues/${SEEDED_LEAGUE.id}/leaderboard`);
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('leaderboard table has expected columns and 12 player rows', async ({ page, pageErrors }) => {
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /performance/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /wr/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /wins/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /losses/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /flawless/i })).toBeVisible();

    // 1 header row + 12 data rows
    await expect(page.getByRole('row')).toHaveCount(13, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('seeded user (Denix) appears in leaderboard, Members section renders below', async ({
    page,
    pageErrors,
  }) => {
    await expect(page.getByRole('cell', { name: /denix/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible({ timeout: 5000 });

    expect(pageErrors).toEqual([]);
  });
});
