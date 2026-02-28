/**
 * Auth smoke tests — focused replacement for auth-flows.spec.ts.
 * Covers: valid login, invalid credentials, protected route redirect.
 */

import { test, expect, TEST_USER, SEEDED_LEAGUE } from './fixtures.js';

test.describe('Auth Smoke', () => {
  // All tests start logged out
  test.use({ storageState: { cookies: [], origins: [] } });

  test('valid login redirects to leagues', async ({ page, pageErrors }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('**/leagues', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /leagues/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('invalid credentials stay on login page', async ({ page, pageErrors }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('WrongPassword1!');
    await page.getByRole('button', { name: /login/i }).click();

    // Should NOT navigate away from /login
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });

  test('protected route redirects to /login', async ({ page, pageErrors }) => {
    await page.goto(`/leagues/${SEEDED_LEAGUE.id}/leaderboard`);

    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });

    expect(pageErrors).toEqual([]);
  });
});
