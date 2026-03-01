/**
 * Page object for the Match registration form.
 * Maps to: client/src/features/matches/MatchDetailsForm.tsx
 *
 * DOM structure per round:
 *   <h5>Round {n}</h5>
 *   <div> (flex container)
 *     <div 50%> P1 name (h6) → CharacterSelect (Autocomplete)
 *     <div 50%> P2 name (h6) → CharacterSelect (Autocomplete)
 *   </div>
 *   <div> "Winner" label → ToggleButtonGroup (P1 name | P2 name)
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
   * Finds the heading "Round {n}" and returns the round wrapper Box.
   * The heading is inside a flex Box which is a child of the round wrapper.
   * We go up two levels: heading → flex container → round wrapper.
   */
  private getRoundContainer(roundNumber: number): Locator {
    return this.page
      .getByRole('heading', { name: `Round ${roundNumber}`, exact: false })
      .locator('../..');
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
   * Set the winner for a round using the ToggleButtonGroup.
   * The ToggleButtonGroup renders two ToggleButtons (P1 name | P2 name).
   * player: 'p1' (first toggle button) or 'p2' (second toggle button)
   *
   * Note: We scope to the "Winner" label's parent to avoid matching
   * MUI Autocomplete [role="group"] elements inside each character select.
   */
  async setWinner(roundNumber: number, player: 'p1' | 'p2') {
    const container = this.getRoundContainer(roundNumber);
    // Find the Winner section wrapper (contains "Winner" text + ToggleButtonGroup)
    const winnerSection = container.getByText('Winner').locator('..');
    const toggleGroup = winnerSection.locator('[role="group"]');
    const buttons = toggleGroup.getByRole('button');
    const index = player === 'p1' ? 0 : 1;
    const target = buttons.nth(index);

    // Idempotent: only click if the button isn't already pressed.
    // MUI ToggleButton deselects on re-click, so clicking an already-pressed
    // button would unset the winner instead of keeping it.
    const pressed = await target.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await target.click();
    }
  }

  /**
   * Clear all data in a round: deselect winner toggle + clear character autocompletes.
   * Used when re-registering a match to remove stale round data.
   */
  async clearRound(roundNumber: number) {
    const container = this.getRoundContainer(roundNumber);

    // Deselect any selected winner toggle button (clicking a selected toggle deselects it)
    const winnerSection = container.getByText('Winner').locator('..');
    const toggleGroup = winnerSection.locator('[role="group"]');
    const toggleButtons = toggleGroup.getByRole('button');
    const toggleCount = await toggleButtons.count();
    for (let i = 0; i < toggleCount; i++) {
      const pressed = await toggleButtons.nth(i).getAttribute('aria-pressed');
      if (pressed === 'true') {
        await toggleButtons.nth(i).click();
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
