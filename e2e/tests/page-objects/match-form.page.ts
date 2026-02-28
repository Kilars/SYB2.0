/**
 * Page object for the Match registration form.
 * Maps to: client/src/features/matches/MatchDetailsForm.tsx
 *
 * DOM structure per round:
 *   <h5>Round {n}</h5>
 *   <div> (flex container)
 *     <div 50%> P1 name (h6) → CharacterSelect (Autocomplete) → "Winner:" + Checkbox
 *     <div 50%> P2 name (h6) → CharacterSelect (Autocomplete) → "Winner:" + Checkbox
 */

import { Page, Locator, expect } from '@playwright/test';

export class MatchFormPage {
  constructor(private page: Page) {}

  async waitForForm() {
    await expect(
      this.page.getByRole('heading', { name: /register match result/i })
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Get the container for a specific round by round number.
   * Finds the heading "Round {n}" and returns its parent Box.
   */
  private getRoundContainer(roundNumber: number): Locator {
    // The round heading is inside a Box that also contains the player columns
    return this.page
      .getByRole('heading', { name: `Round ${roundNumber}`, exact: false })
      .locator('..');
  }

  /**
   * Select a character in the Autocomplete for a given round and player side.
   * player: 'p1' (left/first autocomplete) or 'p2' (right/second autocomplete)
   */
  async selectCharacter(roundNumber: number, player: 'p1' | 'p2', characterFullName: string) {
    const container = this.getRoundContainer(roundNumber);
    const inputs = container.getByPlaceholder('Select character...');
    const index = player === 'p1' ? 0 : 1;
    const input = inputs.nth(index);

    await input.click();
    await input.clear();
    await input.fill(characterFullName);

    // MUI Autocomplete renders each option name twice (non-pop-out + custom-pop-out boxes),
    // making the accessible name "Name Name". Also some names are substrings of others
    // (e.g., "Mario" matches "Dr. Mario"). Use a locator that targets the option containing
    // the exact text, then pick the first match from the filtered dropdown.
    const option = this.page.locator('li[role="option"]').filter({ hasText: characterFullName }).first();
    await option.click();
  }

  /**
   * Set the winner for a round by checking the appropriate checkbox.
   * player: 'p1' (first checkbox) or 'p2' (second checkbox)
   */
  async setWinner(roundNumber: number, player: 'p1' | 'p2') {
    const container = this.getRoundContainer(roundNumber);
    const checkboxes = container.getByRole('checkbox');
    const index = player === 'p1' ? 0 : 1;
    await checkboxes.nth(index).check();
  }

  /**
   * Clear all data in a round: uncheck winner checkbox + clear character autocompletes.
   * Used when re-registering a match to remove stale round data.
   */
  async clearRound(roundNumber: number) {
    const container = this.getRoundContainer(roundNumber);

    // Uncheck any checked winner checkboxes
    const checkboxes = container.getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      if (await checkboxes.nth(i).isChecked()) {
        await checkboxes.nth(i).uncheck();
      }
    }

    // Clear character autocomplete selections using the MUI clear button.
    // The button has visibility:hidden (shown on hover), so normal clicks won't reach it.
    // Use evaluate() to invoke the native click() directly, bypassing CSS visibility.
    const clearBtns = container.locator('.MuiAutocomplete-clearIndicator');
    const clearCount = await clearBtns.count();
    for (let i = clearCount - 1; i >= 0; i--) {
      await clearBtns.nth(i).evaluate(btn => (btn as HTMLButtonElement).click());
      await this.page.waitForTimeout(300);
    }
  }

  async clickComplete() {
    await this.page.getByRole('button', { name: /complete/i }).click();
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
}
