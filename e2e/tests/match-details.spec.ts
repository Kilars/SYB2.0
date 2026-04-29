/**
 * Match details tests.
 *
 * Three focused tests:
 *  1. Completed match (Match 2, 2-0 flawless) — players, exactly 2 rounds, reopen button.
 *  2. Match 3 round-count edge — three rounds present (covers the 3-round case).
 *  3. Navigation — matches list → match detail; URL change loads different match content.
 *
 * Seeded data (SeasonOneLeague.cs):
 *  - Match 2, split 1: hansemann vs denix — denix wins 2-0 (flawless, 2 rounds)
 *  - Match 3, split 1: hansemann vs larsski — hansemann wins 2-1 (3 rounds)
 *  - Match 1, split 1: matias vs bh
 */

import { test, expect, SEEDED_LEAGUE } from './fixtures.js';

const LEAGUE_ID = SEEDED_LEAGUE.id;
const SPLIT = SEEDED_LEAGUE.defaultSplit;

function matchUrl(matchNumber: number): string {
  return `/leagues/${LEAGUE_ID}/bracket/${SPLIT}/match/${matchNumber}`;
}

test.describe('Match details', () => {
  test('completed flawless match (Match 2) shows players, two rounds, and reopen button', async ({
    page,
    pageErrors,
  }) => {
    await page.goto(matchUrl(2));
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });

    // Both player names rendered
    await expect(page.getByText(/hansemann/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/denix/i).first()).toBeVisible({ timeout: 10000 });

    // Exactly 2 rounds rendered (2-0 flawless: only rounds with winnerUserId)
    await expect(page.getByText('Round 1')).toBeVisible();
    await expect(page.getByText('Round 2')).toBeVisible();
    await expect(page.getByText('Round 3')).not.toBeVisible();

    // Reopen button present for league members
    await expect(page.getByRole('button', { name: /reopen match/i })).toBeVisible({
      timeout: 10000,
    });

    expect(pageErrors).toEqual([]);
  });

  test('three-round match (Match 3) shows all three rounds', async ({ page, pageErrors }) => {
    await page.goto(matchUrl(3));
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(/hansemann/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/larsski/i).first()).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Round 1')).toBeVisible();
    await expect(page.getByText('Round 2')).toBeVisible();
    await expect(page.getByText('Round 3')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('matches list navigates to match detail; URL change swaps content', async ({
    page,
    pageErrors,
  }) => {
    // Matches list → click first card → match detail URL
    await page.goto(`/leagues/${LEAGUE_ID}/matches`);
    await expect(page.locator('[class*="MuiCard"]').first()).toBeVisible({ timeout: 15000 });

    const cards = page.locator('[class*="MuiCard"]');
    expect(await cards.count()).toBeGreaterThan(0);

    await cards.first().click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${LEAGUE_ID}/bracket/${SPLIT}/match/\\d+`),
      { timeout: 10000 },
    );

    // Direct URL navigation between matches loads different player content
    await page.goto(matchUrl(2));
    await expect(page.getByText(/denix/i).first()).toBeVisible({ timeout: 15000 });

    await page.goto(matchUrl(1));
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/matias/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/bh/i).first()).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });
});
