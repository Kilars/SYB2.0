/**
 * Page object for the StatusButton component.
 * Maps to: client/src/features/leagues/StatusButton.tsx
 *
 * Status transitions:
 *   Planned (0) → "Start league" → Active (1)
 *   Active (1)  → "Set league to planning phase" → confirmation dialog → Planned (0)
 *   Complete (2) → "Reopen league" → Active (1)
 */

import { Page, expect } from '@playwright/test';

export class StatusButtonPage {
  constructor(private page: Page) {}

  async clickStartLeague() {
    await this.page.getByRole('button', { name: /start league/i }).click();
  }

  async clickRevertToPlanning() {
    await this.page.getByRole('button', { name: /set league to planning phase/i }).click();
  }

  async confirmDeletion() {
    // Wait for dialog to appear
    await expect(
      this.page.getByText(/are you sure you want to move back to planning phase/i)
    ).toBeVisible({ timeout: 5000 });

    await this.page.getByRole('button', { name: /yes \(delete matches\)/i }).click();
  }

  async cancelDeletion() {
    await expect(
      this.page.getByText(/are you sure you want to move back to planning phase/i)
    ).toBeVisible({ timeout: 5000 });

    // The "No" button
    await this.page.getByRole('button', { name: /^no$/i }).click();
  }

  async expectStartLeagueVisible() {
    await expect(
      this.page.getByRole('button', { name: /start league/i })
    ).toBeVisible({ timeout: 5000 });
  }

  async expectStartLeagueNotVisible() {
    await expect(
      this.page.getByRole('button', { name: /start league/i })
    ).not.toBeVisible({ timeout: 3000 });
  }

  async expectRevertVisible() {
    await expect(
      this.page.getByRole('button', { name: /set league to planning phase/i })
    ).toBeVisible({ timeout: 5000 });
  }
}
