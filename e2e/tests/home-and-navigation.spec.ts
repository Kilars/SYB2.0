/**
 * Home page (landing / hero) and navigation tests.
 *
 * Five focused journeys:
 *  1. Unauth landing → CTA → /leagues (NavBar appears, dashboard sections hidden).
 *  2. Auth landing dashboard renders core sections (hero, Your Stats, Recent Matches, Active Leagues).
 *  3. Auth dashboard cards navigate (active league → leaderboard, recent match → match detail).
 *  4. Auth NavBar links + hamburger menu items present and navigate.
 *  5. Unauth NavBar (Login/Register) + protected route redirect to /login.
 */

import { test, expect, SEEDED_LEAGUE } from './fixtures.js';

// ---------------------------------------------------------------------------
// 1. Unauthenticated landing journey
// ---------------------------------------------------------------------------

test.describe('Landing & navigation (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('landing → View Leagues CTA reveals NavBar; dashboard sections stay hidden', async ({
    page,
    pageErrors,
  }) => {
    await page.goto('/');

    // Hero
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/track your league/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /view leagues/i })).toBeVisible();

    // No NavBar on landing, no authenticated dashboard sections
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toHaveCount(0);
    await expect(page.getByText('Your Stats')).toHaveCount(0);
    await expect(page.getByText('Active Leagues')).toHaveCount(0);
    await expect(page.getByText('Recent Matches')).toHaveCount(0);

    // CTA navigates and NavBar appears off-landing
    await page.getByRole('link', { name: /view leagues/i }).click();
    await expect(page).toHaveURL(/\/leagues/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('NavBar shows Login and Register; protected routes redirect to /login', async ({
    page,
    pageErrors,
  }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    // Hamburger menu: Login + Register present, authenticated items absent
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await expect(page.getByRole('menuitem', { name: /^login$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^register$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /my profile/i })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /create league/i })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /create tournament/i })).toHaveCount(0);

    // Protected routes redirect when unauthenticated
    for (const path of ['/createLeague', '/createTournament']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    }

    expect(pageErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Authenticated landing dashboard
// ---------------------------------------------------------------------------

test.describe('Landing & navigation (authenticated)', () => {
  test('landing dashboard renders hero + Your Stats + Recent Matches + Active Leagues', async ({
    page,
    pageErrors,
  }) => {
    await page.goto('/');

    // Hero still visible
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // Your Stats with all four cards
    await expect(page.getByText('Your Stats')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Wins')).toBeVisible();
    await expect(page.getByText('Losses')).toBeVisible();
    await expect(page.getByText('Win Rate')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();

    // Recent Matches with at least one opponent line
    await expect(page.getByText('Recent Matches')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/^vs /).first()).toBeVisible();

    // Active Leagues with the seeded league card
    await expect(page.getByText('Active Leagues')).toBeVisible({ timeout: 15000 });
    const leagueCard = page.locator('.MuiCard-root').filter({ hasText: SEEDED_LEAGUE.title });
    await expect(leagueCard).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('dashboard cards navigate: active league → leaderboard, recent match → match details', async ({
    page,
    pageErrors,
  }) => {
    await page.goto('/');
    await expect(page.getByText('Active Leagues')).toBeVisible({ timeout: 15000 });

    // Click seeded league card → leaderboard
    const leagueCard = page.locator('.MuiCard-root').filter({ hasText: SEEDED_LEAGUE.title });
    await leagueCard.click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/leaderboard`),
      { timeout: 10000 },
    );
    await expect(page.getByRole('tab', { name: /leaderboard/i })).toBeVisible({ timeout: 10000 });

    // Back to dashboard, click a recent match card
    await page.goto('/');
    await expect(page.getByText('Recent Matches')).toBeVisible({ timeout: 15000 });
    await page.locator('[role="link"]').first().click();
    await expect(page).toHaveURL(/\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/round/i, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('NavBar links and hamburger menu items navigate to expected routes', async ({
    page,
    pageErrors,
  }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    // Top-level NavBar nav: Casual → Tournaments → Leagues → logo home
    await page.getByRole('menuitem', { name: /casual/i }).click();
    await expect(page).toHaveURL(/\/casual/, { timeout: 8000 });

    await page.getByRole('menuitem', { name: /tournaments/i }).click();
    await expect(page).toHaveURL(/\/tournaments/, { timeout: 8000 });

    await page.getByRole('menuitem', { name: /leagues/i }).click();
    await expect(page).toHaveURL(/\/leagues/, { timeout: 8000 });

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/^\/$|localhost:\d+\/$/, { timeout: 8000 });
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // Hamburger menu shows authenticated items, not Login/Register
    await page.goto('/leagues');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await expect(page.getByRole('menuitem', { name: /my profile/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /create league/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /create tournament/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^login$/i })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /^register$/i })).toHaveCount(0);

    // Each menu item navigates to its expected route
    await page.getByRole('menuitem', { name: /create league/i }).click();
    await expect(page).toHaveURL(/\/createLeague/, { timeout: 8000 });

    await page.goto('/leagues');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /create tournament/i }).click();
    await expect(page).toHaveURL(/\/createTournament/, { timeout: 8000 });

    await page.goto('/leagues');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /my profile/i }).click();
    await expect(page).toHaveURL(/\/user\//, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });
});
