/**
 * Shared test data constants derived from seeded Persistence layer.
 */

// Seeded user IDs (from Persistence/DbInitializer.cs)
export const USERS = {
  denix:     { userId: 'denix',     displayName: 'Denix',     email: 'denix@test.com' },
  hansemann: { userId: 'hansemann', displayName: 'Hansemann', email: 'hansemann@test.com' },
  larsski:   { userId: 'larsski',   displayName: 'Larsski',   email: 'larsski@test.com' },
  matias:    { userId: 'matias',    displayName: 'Matias',    email: 'matias@test.com' },
} as const;

export const PASSWORD = 'Pa$$w0rd';

// 3-player member list for most lifecycle tests
export const THREE_PLAYERS = [USERS.denix, USERS.hansemann, USERS.larsski];

// Character IDs (seeded in AllCharacters.cs — lowercase string IDs)
// Only characters whose fullName is NOT a substring of another character's fullName.
// E.g., avoid "Mario" (matches "Dr. Mario"), "Link" (matches "Young Link").
export const CHARACTERS = {
  wolf: { id: 'wolf', fullName: 'Wolf' },
  yoshi: { id: 'yoshi', fullName: 'Yoshi' },
  zelda: { id: 'zelda', fullName: 'Zelda' },
  wario: { id: 'wario', fullName: 'Wario' },
  sora: { id: 'sora', fullName: 'Sora' },
  joker: { id: 'joker', fullName: 'Joker' },
} as const;

// Unique league name per test run to avoid collisions
export function uniqueLeagueName(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
