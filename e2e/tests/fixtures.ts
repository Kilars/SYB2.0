import { test as base, expect, Page, ConsoleMessage } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants — seeded test data from Persistence/SeasonOneLeague.cs
// ---------------------------------------------------------------------------

export const TEST_USER = {
  email: 'denix@test.com',
  password: 'Pa$$w0rd',
  displayName: 'Denix',
} as const;

export const SEEDED_LEAGUE = {
  id: 'season-one-league-id',
  title: 'Syb Season One (Trondhomies)',
  // Split 1 is fully seeded with completed matches
  defaultSplit: 1,
  // Match 2 in split 1: hansemann vs denix (denix wins 2-0, flawless)
  completedMatchNumber: 2,
} as const;

/** Public routes — no auth required */
export const PUBLIC_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/leagues', name: 'League List' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
] as const;

/** Protected routes — require authentication (use seeded league ID) */
export const PROTECTED_PAGES = [
  { path: '/createLeague', name: 'Create League' },
  {
    path: `/leagues/${SEEDED_LEAGUE.id}/description`,
    name: 'League Description',
  },
  {
    path: `/leagues/${SEEDED_LEAGUE.id}/leaderboard`,
    name: 'League Leaderboard',
  },
  {
    path: `/leagues/${SEEDED_LEAGUE.id}/matches`,
    name: 'League Matches',
  },
  {
    path: `/leagues/${SEEDED_LEAGUE.id}/stats`,
    name: 'League Stats',
  },
  {
    path: `/leagues/${SEEDED_LEAGUE.id}/split/${SEEDED_LEAGUE.defaultSplit}/match/${SEEDED_LEAGUE.completedMatchNumber}`,
    name: 'Match Details',
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clear auth by navigating without the stored cookie state.
 * For tests that need the logged-out experience, use:
 *   test.use({ storageState: { cookies: [], origins: [] } });
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');
}

/**
 * Perform a full login via the login form UI.
 * Use this only when you need to test the login flow itself.
 * For pre-authenticated tests, the storageState from global-setup is used.
 */
export async function loginViaForm(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  // After successful login the app navigates to /leagues
  await page.waitForURL('**/leagues', { timeout: 15000 });
}

/**
 * Check a page for obvious health problems.
 * Returns an array of error descriptions (empty = healthy).
 */
export async function checkPageHealth(page: Page): Promise<string[]> {
  const errors: string[] = [];

  // Page must have meaningful content
  const body = page.locator('body');
  const content = await body.textContent();
  if (!content || content.trim().length < 20) {
    errors.push('Page appears empty');
  }

  // No React error boundary crash text
  const errorBoundaryCount = await page
    .getByText(/something went wrong|an error occurred/i)
    .count();
  if (errorBoundaryCount > 0) {
    errors.push('Error boundary displayed');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Extended test fixture — collects console errors during each test
// ---------------------------------------------------------------------------

export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];

    const consoleHandler = (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore noise that doesn't indicate real problems
        if (
          !text.includes('favicon') &&
          !text.includes('net::ERR') &&
          !text.includes('Failed to load resource')
        ) {
          errors.push(`Console: ${text.slice(0, 200)}`);
        }
      }
    };

    const pageErrorHandler = (error: Error) => {
      errors.push(`Page error: ${error.message.slice(0, 200)}`);
    };

    page.on('console', consoleHandler);
    page.on('pageerror', pageErrorHandler);

    await use(errors);

    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);
  },
});

export { expect };
