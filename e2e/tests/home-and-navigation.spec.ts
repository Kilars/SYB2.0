/**
 * Home page (landing / hero) and navigation tests.
 * Covers: hero section, CTA, authenticated dashboard sections,
 * NavBar links, hamburger menu items, route transitions.
 */

import { test, expect, clearAuthState, TEST_USER, SEEDED_LEAGUE } from './fixtures.js';

// ---------------------------------------------------------------------------
// Landing page — unauthenticated
// ---------------------------------------------------------------------------

test.describe('Landing Page (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('hero section renders with title, subtitle, and CTA', async ({ page, pageErrors }) => {
    await page.goto('/');

    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/track your league/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /view leagues/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('no NavBar on home page', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // NavBar has a hamburger button with this aria-label — should NOT be present on home
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test('authenticated sections are NOT visible when logged out', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // These sections only render for authenticated users
    await expect(page.getByText('Your Stats')).toHaveCount(0);
    await expect(page.getByText('Active Leagues')).toHaveCount(0);
    await expect(page.getByText('Active Tournaments')).toHaveCount(0);
    await expect(page.getByText('Recent Matches')).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test('"View Leagues" CTA navigates to /leagues', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    await page.getByRole('link', { name: /view leagues/i }).click();
    await expect(page).toHaveURL(/\/leagues/, { timeout: 10000 });

    // NavBar should now be visible since we left the home page
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Landing page — authenticated
// ---------------------------------------------------------------------------

test.describe('Landing Page (authenticated)', () => {
  // Uses pre-loaded auth from global-setup

  test('hero section still renders when authenticated', async ({ page, pageErrors }) => {
    await page.goto('/');

    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/track your league/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /view leagues/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('dashboard sections render for authenticated user', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // "Your Stats" section with the 4 stat cards
    await expect(page.getByText('Your Stats')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Wins')).toBeVisible();
    await expect(page.getByText('Losses')).toBeVisible();
    await expect(page.getByText('Win Rate')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('recent matches section renders', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // The test user (Denix) has seeded match data — Recent Matches should appear
    await expect(page.getByText('Recent Matches')).toBeVisible({ timeout: 15000 });

    // At least one match card with "vs" opponent name
    await expect(page.getByText(/^vs /).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('clicking active league card navigates to league page', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // Wait for Active Leagues section to load
    await expect(page.getByText('Active Leagues')).toBeVisible({ timeout: 15000 });

    // The seeded league (status=Active) should appear as a clickable card
    const leagueCard = page.locator('.MuiCard-root').filter({ hasText: SEEDED_LEAGUE.title });
    await expect(leagueCard).toBeVisible();

    // Click the league card — navigates to /leagues/{id}/leaderboard
    await leagueCard.click();
    await expect(page).toHaveURL(
      new RegExp(`leagues/${SEEDED_LEAGUE.id}/leaderboard`),
      { timeout: 10000 },
    );

    // Leaderboard tab should be visible and active
    await expect(page.getByRole('tab', { name: /leaderboard/i })).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('clicking recent match card navigates to match details', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    // Wait for Recent Matches section
    await expect(page.getByText('Recent Matches')).toBeVisible({ timeout: 15000 });

    // Match cards have role="link" — click the first one
    const matchCard = page.locator('[role="link"]').first();
    await expect(matchCard).toBeVisible();

    // Capture opponent name for verification after navigation
    const opponentText = await matchCard.getByText(/^vs /).textContent();

    await matchCard.click();

    // Should navigate to a match details page
    await expect(page).toHaveURL(/\/bracket\/\d+\/match\/\d+/, { timeout: 10000 });

    // Match details page should render player names
    await expect(page.locator('body')).toContainText(/round/i, { timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('active league card shows match progress chip', async ({ page, pageErrors }) => {
    await page.goto('/');
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Active Leagues')).toBeVisible({ timeout: 15000 });

    // The seeded league card should have a progress chip (e.g., "66/132")
    const leagueCard = page.locator('.MuiCard-root').filter({ hasText: SEEDED_LEAGUE.title });
    // The chip shows completed/total format like "X/Y"
    await expect(leagueCard.getByText(/\d+\/\d+/)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// NavBar — authenticated
// ---------------------------------------------------------------------------

test.describe('NavBar (authenticated)', () => {
  test('NavBar links navigate to correct routes', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    // Click "Casual" nav link
    await page.getByRole('menuitem', { name: /casual/i }).click();
    await expect(page).toHaveURL(/\/casual/, { timeout: 8000 });

    // Click "Tournaments" nav link
    await page.getByRole('menuitem', { name: /tournaments/i }).click();
    await expect(page).toHaveURL(/\/tournaments/, { timeout: 8000 });

    // Click "Leagues" nav link
    await page.getByRole('menuitem', { name: /leagues/i }).click();
    await expect(page).toHaveURL(/\/leagues/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });

  test('logo navigates to home page', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({ timeout: 10000 });

    // The SYB logo is a NavLink to "/" — click it
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/^\/$|localhost:\d+\/$/, { timeout: 8000 });

    // Home page hero should be visible
    await expect(page.getByText('Smash Your Bros')).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('hamburger menu shows authenticated items', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({ timeout: 10000 });

    // Open hamburger menu
    await page.getByRole('button', { name: /open navigation menu/i }).click();

    // Authenticated menu items
    await expect(page.getByRole('menuitem', { name: /my profile/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /create league/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /create tournament/i })).toBeVisible();

    // Login/Register should NOT be present when authenticated
    await expect(page.getByRole('menuitem', { name: /^login$/i })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /^register$/i })).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test('hamburger menu "My Profile" navigates to user page', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /my profile/i }).click();

    await expect(page).toHaveURL(/\/user\//, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });

  test('hamburger menu "Create League" navigates to create form', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /create league/i }).click();

    await expect(page).toHaveURL(/\/createLeague/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });

  test('hamburger menu "Create Tournament" navigates to create form', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /create tournament/i }).click();

    await expect(page).toHaveURL(/\/createTournament/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// NavBar — unauthenticated
// ---------------------------------------------------------------------------

test.describe('NavBar (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('hamburger menu shows Login and Register, not auth items', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole('button', { name: /open navigation menu/i }).click();

    // Unauthenticated menu items
    await expect(page.getByRole('menuitem', { name: /^login$/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^register$/i })).toBeVisible();

    // Authenticated menu items should NOT be present
    await expect(page.getByRole('menuitem', { name: /my profile/i })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /create league/i })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: /create tournament/i })).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test('Login menu item navigates to login page', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /^login$/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });

  test('Register menu item navigates to register page', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('menuitem', { name: /^register$/i }).click();

    await expect(page).toHaveURL(/\/register/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });

  test('public nav links work without auth', async ({ page, pageErrors }) => {
    await page.goto('/leagues');
    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible({
      timeout: 10000,
    });

    // Casual link
    await page.getByRole('menuitem', { name: /casual/i }).click();
    await expect(page).toHaveURL(/\/casual/, { timeout: 8000 });

    // Tournaments link
    await page.getByRole('menuitem', { name: /tournaments/i }).click();
    await expect(page).toHaveURL(/\/tournaments/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Route protection
// ---------------------------------------------------------------------------

test.describe('Route Protection', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('protected routes redirect to /login when unauthenticated', async ({ page, pageErrors }) => {
    const protectedPaths = ['/createLeague', '/createTournament'];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    }

    expect(pageErrors).toEqual([]);
  });
});
