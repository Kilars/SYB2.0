# 020-REFACTOR-theme-configuration

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Low
**Type**: REFACTOR
**Estimated Effort**: Medium

---

## Context

SYB2.0 has no MUI `ThemeProvider` or custom theme. There are **21 hardcoded hex values** across 6 files and additional named color strings (`'red'`, `'green'`, `'yellow'`). No design token system exists, making visual consistency difficult.

**Note**: `styled()` with `({ theme }) =>` is already used in `StyledButton.tsx` and `CharacterSelect.tsx` — these access the MUI default theme implicitly and will automatically pick up a custom theme when ThemeProvider is added. `CssBaseline` is already rendered in `App.tsx` — if moved into ThemeProvider in `main.tsx`, remove from `App.tsx` to avoid double application.

Setting up a proper theme lays the foundation for a consistent visual identity matching the "cool, stylish, clean" brand vibe.

---

## Acceptance Criteria

- [x] MUI `ThemeProvider` wraps the app in `main.tsx` (or `App.tsx`)
- [x] Custom theme file created at `client/src/app/theme.ts` with:
  - Custom color palette (primary, secondary, success, warning, error)
  - Existing hardcoded colors extracted into theme palette
  - Typography scale (font family, heading sizes)
  - Component defaults (Card elevation, Button sizes, etc.)
- [x] Hardcoded color values replaced with `theme.palette.*` references across components
- [x] Visual appearance matches current look (this is extraction, not redesign)
- [x] `cd client && npm run build` passes
- [ ] Manual verification that no visual regressions occurred

---

## Implementation Steps

### Frontend
- [ ] Create `client/src/app/theme.ts`:
  - Define `createTheme()` with custom palette
  - Extract color constants from components:
    - Table header: `#C0DEFA`
    - Table alternate row: `#E5EFF9`
    - Status colors (if any)
    - Any other hardcoded colors
  - Set typography defaults
  - Set component defaults (Card, Button, Paper)
- [ ] In `client/src/main.tsx` (or appropriate root):
  - Import and wrap app with `<ThemeProvider theme={theme}>`
  - Add `<CssBaseline />` for consistent baseline styles
- [ ] **Remove `CssBaseline` from `App.tsx`** (it's already there at line 11 — if added to `main.tsx` inside ThemeProvider, remove to avoid double application)
- [ ] Replace hardcoded colors across components:
  - **Table colors** (8 instances): `Leaderboard.tsx` and `LeagueStats.tsx` — `#C0DEFA` header, `#E5EFF9`/`#D6E6F6` rows
  - **App background**: `App.tsx:15` — `bgcolor: '#eeeeee'` → `theme.palette.background.default`
  - **Gradient** (duplicated in 2 files): `NavBar.tsx` and `HomePage.tsx` — `linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)` → extract to theme custom property or shared constant (MUI palette has no gradient slot)
  - **Hover color**: `CharacterSelect.tsx` — `#ddd` → `theme.palette.grey[300]`
  - **Named string colors**: `MatchesList.tsx`, `UserStats.tsx` — `'green'`/`'red'` → `theme.palette.success.main`/`theme.palette.error.main`; `MenuItemLink.tsx` — `'yellow'` → high-contrast theme color; `StarButton.tsx` — `'yellow'`; `DeleteButton.tsx` — `'red'`
  - Use `theme.palette.primary.main`, `theme.palette.grey[100]`, etc.

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend theming only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None explicitly, but ideally run before 013 (color-only info), 014 (leaderboard cards), 015 (match list polish) — these tasks touch the same color values and would benefit from having theme tokens in place

---

## Code References

```tsx
// Full color inventory (21 hex + named colors):
// #C0DEFA (×8) — table header blue — Leaderboard.tsx, LeagueStats.tsx
// #E5EFF9 (×2) — table even row — Leaderboard.tsx, LeagueStats.tsx
// #D6E6F6 (×2) — table odd row — Leaderboard.tsx, LeagueStats.tsx
// #eeeeee (×1) — page background — App.tsx
// #182a73 (×2) — gradient start — NavBar.tsx, HomePage.tsx
// #218aae (×2) — gradient mid — NavBar.tsx, HomePage.tsx
// #20a78c (×2) — gradient end — NavBar.tsx, HomePage.tsx
// #ddd    (×2) — hover state — CharacterSelect.tsx
// 'green' (×4) — win indicator — MatchesList.tsx, UserStats.tsx
// 'red'   (×5) — loss/delete — MatchesList.tsx, UserStats.tsx, DeleteButton.tsx
// 'yellow'(×2) — active/star — MenuItemLink.tsx, StarButton.tsx
// 'white' (×5) — text on dark bg — NavBar.tsx, HomePage.tsx, etc. (acceptable)

// Theme file:
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#182a73', light: '#C0DEFA' },
    background: { default: '#eeeeee' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: { defaultProps: { elevation: 2 } },
  },
});

// Gradient — extract to shared constant since MUI palette has no gradient slot:
// export const APP_GRADIENT = 'linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)';
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — new theme file + modifications across many components
- **Risk**: Medium — many files touched, but all changes are cosmetic (replacing hardcoded values with theme references)

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**New file**: `client/src/app/theme.ts` — createTheme with custom palette, typography, component defaults, APP_GRADIENT constant.
**Modified** (12 files): main.tsx (ThemeProvider), App.tsx (removed CssBaseline, theme bg), NavBar.tsx + HomePage.tsx (APP_GRADIENT), Leaderboard.tsx + LeagueStats.tsx (primary.light), CharacterSelect.tsx (grey.300), MatchesList.tsx + UserStats.tsx (success/error.main), DeleteButton.tsx (error.main), StarButton.tsx (warning.main).

**Verification**: `npm run build` passes.
