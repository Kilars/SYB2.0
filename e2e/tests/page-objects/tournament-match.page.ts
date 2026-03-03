/**
 * Page object for the Tournament Match Details form.
 * Maps to: client/src/features/tournaments/TournamentMatchDetails.tsx
 *
 * DOM structure per round (when not completed):
 *   Card[variant="outlined"]
 *     CardContent
 *       <h5>Round {n}</h5>
 *       <div flex> P1 name (h6) + CharacterSelect | P2 name (h6) + CharacterSelect
 *       "Who won Round N?" → ToggleButtonGroup[aria-label="Round N winner selection"]
 */

import { Page, Locator, expect } from '@playwright/test';

export class TournamentMatchPage {
  constructor(private page: Page) {}

  async waitForForm() {
    // Wait for the match details page to load in any state (form or completed).
    // The "Back to Bracket" link is always present.
    await expect(
      this.page.getByRole('link', { name: /back to bracket/i }).first()
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Get the container Card for a specific round.
   * Heading "Round {n}" is inside CardContent. Traverse up to the Card.
   */
  private getRoundContainer(roundNumber: number): Locator {
    return this.page
      .locator('[class*="MuiCard"]')
      .filter({ has: this.page.getByRole('heading', { name: `Round ${roundNumber}` }) });
  }

  /**
   * Select a character in the Autocomplete for a given round and player side.
   * CharacterSelect renders Autocomplete with placeholder "Select character..."
   */
  async selectCharacter(roundNumber: number, player: 'p1' | 'p2', characterFullName: string) {
    const container = this.getRoundContainer(roundNumber);
    const inputs = container.getByPlaceholder('Select character...');
    const index = player === 'p1' ? 0 : 1;
    const input = inputs.nth(index);

    await input.click();
    await input.clear();
    await input.fill(characterFullName);

    const option = this.page.locator('li[role="option"]')
      .filter({ hasText: characterFullName }).first();
    await option.click();
  }

  /**
   * Set the winner for a round. Idempotent — only clicks if not already selected.
   */
  async setWinner(roundNumber: number, player: 'p1' | 'p2') {
    const container = this.getRoundContainer(roundNumber);
    const toggleGroup = container.getByRole('group', {
      name: new RegExp(`Round ${roundNumber} winner`, 'i'),
    });
    const buttons = toggleGroup.getByRole('button');
    const index = player === 'p1' ? 0 : 1;
    const target = buttons.nth(index);

    const pressed = await target.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await target.click();
    }
  }

  /**
   * Clear all data in a round: deselect winner toggle + clear character autocompletes.
   */
  async clearRound(roundNumber: number) {
    const container = this.getRoundContainer(roundNumber);

    // Deselect any selected winner toggle
    const toggleGroup = container.getByRole('group', {
      name: new RegExp(`Round ${roundNumber} winner`, 'i'),
    });
    const toggleButtons = toggleGroup.getByRole('button');
    const toggleCount = await toggleButtons.count();
    for (let i = 0; i < toggleCount; i++) {
      const pressed = await toggleButtons.nth(i).getAttribute('aria-pressed');
      if (pressed === 'true') {
        await toggleButtons.nth(i).click();
      }
    }

    // Clear character autocomplete selections via hidden MUI clear button
    const inputs = container.getByPlaceholder('Select character...');
    const clearBtns = container.locator('.MuiAutocomplete-clearIndicator');
    const clearCount = await clearBtns.count();
    for (let i = clearCount - 1; i >= 0; i--) {
      await clearBtns.nth(i).evaluate(btn => (btn as HTMLButtonElement).click());
      // Wait for MUI to process the clear rather than using an arbitrary timeout
      await expect(inputs.nth(i)).toHaveValue('', { timeout: 2000 });
    }
  }

  /**
   * Fill a complete round: character selections + winner.
   */
  async fillRound(
    roundNumber: number,
    p1Char: string,
    p2Char: string,
    winner: 'p1' | 'p2'
  ) {
    await this.selectCharacter(roundNumber, 'p1', p1Char);
    await this.selectCharacter(roundNumber, 'p2', p2Char);
    await this.setWinner(roundNumber, winner);
  }

  async clickComplete() {
    await this.page.getByRole('button', { name: /complete/i }).click();
  }

  async clickReopen() {
    await this.page.getByRole('button', { name: /reopen match/i }).click();
    // Handle the confirmation dialog
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^reopen$/i }).click();
  }

  async clickBackToBracket() {
    await this.page.getByRole('link', { name: /back to bracket/i }).first().click();
  }

  /**
   * Read P1 and P2 display names from the score header h5 headings.
   * The score header has: P1 name (h5) | "N — N" (h5) | P2 name (h5).
   */
  async getPlayerNames(): Promise<{ p1: string; p2: string }> {
    const headings = this.page.getByRole('heading', { level: 5 });
    const allTexts = await headings.allTextContents();
    // Filter: keep only player names (exclude score "N — N" and any "wins!" text)
    const playerNames = allTexts.filter(
      t => !t.includes('—') && !t.includes('Match') && !t.includes('wins')
    );
    return { p1: playerNames[0]?.trim(), p2: playerNames[1]?.trim() };
  }

  async getScore(): Promise<{ p1: number; p2: number }> {
    const headings = this.page.getByRole('heading', { level: 5 });
    const allTexts = await headings.allTextContents();
    const scoreText = allTexts.find(t => t.includes('—'));
    if (!scoreText) return { p1: 0, p2: 0 };
    const parts = scoreText.split('—').map(s => parseInt(s.trim(), 10));
    return { p1: parts[0], p2: parts[1] };
  }

  async expectCompleted() {
    await expect(
      this.page.getByRole('button', { name: /reopen match/i })
    ).toBeVisible({ timeout: 10000 });
  }

  async expectRegisterForm() {
    await expect(
      this.page.getByRole('heading', { name: /register match result/i })
    ).toBeVisible();
  }
}
