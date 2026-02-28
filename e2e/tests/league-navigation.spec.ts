/**
 * League navigation tests.
 * Covers: league list display, clicking through to league detail,
 * tab switching (description/leaderboard/matches/stats), leaderboard data.
 *
 * All tests use pre-authenticated state from global-setup.
 */

import {
  test,
  expect,
  SEEDED_LEAGUE,
} from './fixtures.js';

test.describe('League List', () => {
  test('league list shows seeded league', async ({ page }) => {
    await page.goto('/leagues');

    // "Leagues" heading must be present
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({
      timeout: 10000,
    });

    // The seeded league title must appear
    await expect(page.getByText(SEEDED_LEAGUE.title)).toBeVisible({ timeout: 10000 });
  });

  test('clicking View on seeded league navigates to league detail', async ({ page }) => {
    await page.goto('/leagues');
    await expect(page.getByText(SEEDED_LEAGUE.title)).toBeVisible({ timeout: 10000 });

    // Click the "View" button on the seeded league card
    // LeagueList renders a "View" button with Visibility icon per league
    await page.getByRole('button', { name: /view/i }).first().click();

    // Should navigate to the leaderboard tab by default (LeagueList navigates to /leaderboard)
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}`),
      { timeout: 10000 }
    );
  });

  test('league list shows league members count', async ({ page }) => {
    await page.goto('/leagues');
    await expect(page.getByText(SEEDED_LEAGUE.title)).toBeVisible({ timeout: 10000 });

    // 12 members are seeded — the count "12" should appear in the card
    // LeagueList renders league.members.length
    await expect(page.getByText('12')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('League Tab Navigation', () => {
  // Start on leaderboard (default tab from league list "View" button)
  test.beforeEach(async ({ page }) => {
    await page.goto(`/leagues/${SEEDED_LEAGUE.id}/leaderboard`);
    // Wait for the league title to confirm the page loaded
    await expect(page.getByText(SEEDED_LEAGUE.title)).toBeVisible({ timeout: 15000 });
  });

  test('leaderboard tab is active when on /leaderboard route', async ({ page }) => {
    // The Leaderboard tab should be selected (MUI uses aria-selected="true")
    const leaderboardTab = page.getByRole('tab', { name: /leaderboard/i });
    await expect(leaderboardTab).toBeVisible();
    await expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking Description tab navigates to description route', async ({ page }) => {
    await page.getByRole('tab', { name: /description/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/description`),
      { timeout: 8000 }
    );
  });

  test('clicking Matches tab navigates to matches route', async ({ page }) => {
    await page.getByRole('tab', { name: /matches/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/matches`),
      { timeout: 8000 }
    );
  });

  test('clicking Stats tab navigates to stats route', async ({ page }) => {
    await page.getByRole('tab', { name: /stats/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/stats`),
      { timeout: 8000 }
    );
  });
});

test.describe('Leaderboard Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/leagues/${SEEDED_LEAGUE.id}/leaderboard`);
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('leaderboard table has expected columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /player/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /points/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /wr/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /wins/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /losses/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /flawless/i })).toBeVisible();
  });

  test('leaderboard has 12 player rows (seeded league members)', async ({ page }) => {
    // 1 header row + 12 data rows = 13 total
    await expect(page.getByRole('row')).toHaveCount(13, { timeout: 10000 });
  });

  test('Denix appears in the leaderboard (test user)', async ({ page }) => {
    // Denix is one of the 12 seeded users
    await expect(page.getByRole('cell', { name: /denix/i })).toBeVisible({ timeout: 5000 });
  });

  test('members section shows player chips below leaderboard', async ({ page }) => {
    // Leaderboard component renders a "Members" section with UserChip components
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible({ timeout: 5000 });
  });
});
