/**
 * Match details tests.
 * Covers: viewing a completed match, round data display, navigation between matches.
 *
 * Seeded data context (SeasonOneLeague.cs):
 * - All split 1 matches are completed (Completed = true)
 * - Match 2, split 1: hansemann vs denix — denix wins 2-0 (flawless)
 *   Round 1: yoshi (hansemann) vs king_k_rool (denix), winner = denix
 *   Round 2: ness (hansemann) vs hero (denix), winner = denix
 * - Match 3, split 1: hansemann vs larsski — hansemann wins 2-1
 *
 * All tests use pre-authenticated state from global-setup.
 */

import {
  test,
  expect,
  SEEDED_LEAGUE,
} from './fixtures.js';

const LEAGUE_ID = SEEDED_LEAGUE.id;
const SPLIT = SEEDED_LEAGUE.defaultSplit;

/** Navigate to a specific match detail page */
function matchUrl(matchNumber: number): string {
  return `/leagues/${LEAGUE_ID}/split/${SPLIT}/match/${matchNumber}`;
}

test.describe('Completed Match View', () => {
  test.beforeEach(async ({ page }) => {
    // Match 2: hansemann vs denix, completed (2-0 flawless win for denix)
    await page.goto(matchUrl(2));
    // Wait for MatchDetailsView to render (shows round data for completed matches)
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('completed match renders round information', async ({ page, pageErrors }) => {
    // MatchDetailsView renders each completed round with "Round N" heading
    await expect(page.getByText('Round 1')).toBeVisible();
    await expect(page.getByText('Round 2')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('completed match shows both player names', async ({ page, pageErrors }) => {
    // MatchDetailsView renders matchData.playerOne.displayName and playerTwo.displayName
    await expect(page.getByText(/hansemann/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/denix/i).first()).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('completed match shows Reopen Match button', async ({ page, pageErrors }) => {
    // MatchDetailsView always shows a "Reopen match" button for league members
    await expect(page.getByRole('button', { name: /reopen match/i })).toBeVisible({
      timeout: 10000,
    });

    expect(pageErrors).toEqual([]);
  });

  test('match 2 shows 2 completed rounds (flawless 2-0)', async ({ page, pageErrors }) => {
    // Denix won 2-0 so only 2 rounds have winnerUserId set
    // MatchDetailsView filters: .filter(r => !!r.winnerUserId)
    // Each round is rendered as a Card with "Round N" text
    await expect(page.getByText('Round 1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Round 2')).toBeVisible();
    // Round 3 should NOT be visible (only 2 rounds completed in a 2-0)
    await expect(page.getByText('Round 3')).not.toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

test.describe('Match 3 — Three-Round Match', () => {
  test('match 3 shows 3 completed rounds (hansemann wins 2-1)', async ({ page, pageErrors }) => {
    await page.goto(matchUrl(3));
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });

    // Match 3: hansemann vs larsski — 3 rounds played
    await expect(page.getByText('Round 1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Round 2')).toBeVisible();
    await expect(page.getByText('Round 3')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('match 3 shows both player names', async ({ page, pageErrors }) => {
    await page.goto(matchUrl(3));
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(/hansemann/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/larsski/i).first()).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });
});

test.describe('Match Navigation', () => {
  test('navigating between matches via URL changes content', async ({ page, pageErrors }) => {
    // Match 2: hansemann vs denix
    await page.goto(matchUrl(2));
    await expect(page.getByText(/denix/i).first()).toBeVisible({ timeout: 15000 });

    // Navigate to match 1: matias vs bh
    await page.goto(matchUrl(1));
    await expect(page.getByText(/round/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/matias/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/bh/i).first()).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('matches list navigates to match detail on click', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${LEAGUE_ID}/matches`);

    // MatchesList renders match cards that are clickable
    await expect(page.locator('[class*="MuiCard"]').first()).toBeVisible({ timeout: 15000 });

    // Click the first match card — it navigates to the match detail page
    await page.locator('[class*="MuiCard"]').first().click();

    // Should navigate to a match detail URL
    await expect(page).toHaveURL(
      new RegExp(`leagues/${LEAGUE_ID}/split/${SPLIT}/match/\\d+`),
      { timeout: 10000 }
    );

    expect(pageErrors).toEqual([]);
  });

  test('match detail page loads from matches list tab', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${LEAGUE_ID}/matches`);
    await expect(page.locator('[class*="MuiCard"]').first()).toBeVisible({ timeout: 15000 });

    // Matches list shows player names for each match card
    // The list is not empty (66 matches seeded in split 1)
    const cards = page.locator('[class*="MuiCard"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
  });
});
