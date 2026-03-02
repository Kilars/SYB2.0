/**
 * Page object for the Tournament Bracket view.
 * Maps to: client/src/features/tournaments/BracketView.tsx
 */

import { Page, expect } from '@playwright/test';

export class BracketViewPage {
  constructor(private page: Page) {}

  /**
   * Wait for bracket round headings to appear (indicates bracket has rendered).
   * For a 4-player bracket: "Semifinals" and "Final".
   */
  async waitForBracket() {
    await expect(this.page.getByText('Final')).toBeVisible({ timeout: 15000 });
  }

  async expectTitle(title: string) {
    await expect(
      this.page.getByRole('heading', { level: 4, name: title })
    ).toBeVisible({ timeout: 15000 });
  }

  async expectStatus(status: 'Planned' | 'Active' | 'Complete') {
    await expect(this.page.getByText(status, { exact: true }).first()).toBeVisible({ timeout: 10000 });
  }

  async expectPlayerCount(n: number) {
    await expect(this.page.getByText(`${n} players`)).toBeVisible();
  }

  async expectMemberChip(name: string) {
    await expect(this.page.getByText(name).first()).toBeVisible();
  }

  async clickStartTournament() {
    await this.page.getByRole('button', { name: /start tournament/i }).click();
    await this.waitForBracket();
  }

  async clickShuffleBracket() {
    await this.page.getByRole('button', { name: /shuffle bracket/i }).click();
    // Wait for the shuffle to complete (button re-enables)
    await expect(
      this.page.getByRole('button', { name: /shuffle bracket/i })
    ).toBeEnabled({ timeout: 10000 });
  }

  async clickDelete() {
    await this.page.getByRole('button', { name: /^delete$/i }).click();
  }

  async confirmDelete() {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole('button', { name: /^delete$/i }).click();
  }

  async cancelDelete() {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole('button', { name: /cancel/i }).click();
  }

  /**
   * Click a match card that contains the given player name.
   */
  async clickMatchCard(playerName: string) {
    const card = this.page.locator('[class*="MuiCard"]')
      .filter({ hasText: playerName });
    await card.first().click();
  }

  /**
   * Read all semifinal match assignments from the rendered bracket.
   * Since seeding is randomized (Fisher-Yates), tests must discover actual assignments.
   *
   * For a 4-player bracket: 2 semifinal cards (first column) + 1 final card = 3 total.
   */
  async getSemifinalists(): Promise<{
    match1: { p1: string; p2: string };
    match2: { p1: string; p2: string };
  }> {
    const cards = this.page.locator('[class*="MuiCard"]');
    await expect(cards).toHaveCount(3, { timeout: 15000 });

    // First two cards are semifinals (rendered in bracket order)
    const card1Texts = await cards.nth(0).locator('[class*="MuiTypography-body2"]').allTextContents();
    const card2Texts = await cards.nth(1).locator('[class*="MuiTypography-body2"]').allTextContents();

    // Filter out win count numbers (single digit strings) — keep player names
    const isPlayerName = (t: string) => t.trim().length > 1;

    const m1 = card1Texts.filter(isPlayerName);
    const m2 = card2Texts.filter(isPlayerName);

    return {
      match1: { p1: m1[0]?.trim(), p2: m1[1]?.trim() },
      match2: { p1: m2[0]?.trim(), p2: m2[1]?.trim() },
    };
  }

  /**
   * Get the player names shown in the Final match card.
   */
  async getFinalists(): Promise<{ p1: string; p2: string }> {
    const cards = this.page.locator('[class*="MuiCard"]');
    const finalCard = cards.last();
    const texts = await finalCard.locator('[class*="MuiTypography-body2"]').allTextContents();
    const isPlayerName = (t: string) => t.trim().length > 1;
    const players = texts.filter(isPlayerName);
    return { p1: players[0]?.trim(), p2: players[1]?.trim() };
  }

  async expectWinnerBanner(displayName: string) {
    await expect(
      this.page.getByText(`${displayName} wins!`)
    ).toBeVisible({ timeout: 15000 });
  }

  async expectStartNotVisible() {
    await expect(
      this.page.getByRole('button', { name: /start tournament/i })
    ).not.toBeVisible();
  }

  async expectShuffleNotVisible() {
    await expect(
      this.page.getByRole('button', { name: /shuffle bracket/i })
    ).not.toBeVisible();
  }

  async expectDeleteNotVisible() {
    await expect(
      this.page.getByRole('button', { name: /^delete$/i })
    ).not.toBeVisible();
  }

  async getMatchCardCount(): Promise<number> {
    return await this.page.locator('[class*="MuiCard"]').count();
  }
}
