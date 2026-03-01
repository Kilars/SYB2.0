# 021-FEATURE-homepage-polish

**Status**: Backlog
**Created**: 2026-02-28
**Priority**: Low
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

The homepage has a `<Group />` MUI icon (people silhouettes — unrelated to Smash Bros) that could be more game-themed. The page already has more polish than it may seem at first glance:

**What already exists**:
- Title: "Smash Your Bros" at `variant="h3"` (note: "Bros" not "Boys" — decide which to use)
- Subtitle: "Welcome to SYB 2.0" at `variant="h5"`
- CTA button: "Take me to the leagues" — already `variant="contained"`, `size="large"`, `height: 80`
- Layout: `display: 'flex', flexDirection: 'column', alignItems: 'center'` on a `<Paper>`
- Background: gradient (`linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)`)

**What needs improvement**:
- The `<Group />` icon is generic — swap for a game-related icon
- The subtitle "Welcome to SYB 2.0" is generic — replace with a tagline explaining what SYB is
- The overall look is functional but not stylish

The brand vibe is "social game night tool — cool, stylish, clean."

---

## Acceptance Criteria

- [x] Homepage icon/visual is game-related (e.g., `<SportsEsports />` icon, controller icon, or a custom logo/wordmark)
- [x] Brief tagline explaining what SYB is (e.g., "Track your Smash Bros league — matches, stats, and bragging rights")
- [x] CTA button is more prominent and styled (larger, primary color, maybe with an icon)
- [x] Layout is centered and looks good on both mobile and desktop
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] In `client/src/features/home/HomePage.tsx`:
  - Replace `<Group />` icon with `<SportsEsports />` or similar game-related icon from `@mui/icons-material`
  - Replace "Welcome to SYB 2.0" subtitle with a descriptive tagline (e.g., "Track your Smash Bros league — matches, stats, and bragging rights")
  - **Decide**: Title says "Smash Your Bros" — should it match the app name "Smash Your Boys" (SYB)?
  - CTA button: already `variant="contained"` and `size="large"` — optionally add `startIcon` and rephrase from "Take me to the leagues" to something punchier like "View Leagues"
  - Layout: flex centering already exists — no change needed
  - Background: gradient already exists — no change needed
  - Remove or repurpose the `<Box>` wrappers around title/CTA if simplifying the structure

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified — frontend display only
- [x] **Round-robin**: Match generation logic is not affected — no domain changes
- [x] **Statistics**: Points/flawless computation is not affected — no domain changes
- [x] **Guest identity**: UserId FK references are preserved — no domain changes
- [x] **Authorization**: Route params match handler expectations — no auth handler changes

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

```tsx
// Current HomePage — actual code:
<Group sx={{ height: 50, width: 50 }} />
<Typography variant="h3">Smash Your Bros</Typography>
<Typography variant="h5">Welcome to SYB 2.0</Typography>
<Button variant="contained" size="large" component={Link} to="/leagues"
  sx={{ height: 80, borderRadius: 4, fontSize: '1.0rem' }}>
  Take me to the leagues
</Button>
// All inside <Paper> with gradient background, flex-column centering

// Proposed changes:
<SportsEsports sx={{ fontSize: 80, color: 'white' }} />  // or height/width to match existing pattern
<Typography variant="h3">Smash Your Boys</Typography>  // or keep "Bros" — deliberate decision
<Typography variant="h5" sx={{ opacity: 0.9 }}>
  Track your league — matches, stats, and bragging rights
</Typography>
<Button variant="contained" size="large" component={Link} to="/leagues"
  startIcon={<EmojiEvents />}
  sx={{ height: 80, borderRadius: 4, fontSize: '1.0rem' }}>
  View Leagues
</Button>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single component change
- **Risk**: Low — isolated visual change

---

## Progress Log

[Updated during implementation]

---

## Resolution

**Completed**: 2026-02-28

**Changes**: HomePage.tsx — Replaced Group icon with SportsEsports (fontSize: 80). Updated subtitle to descriptive tagline. Added EmojiEvents startIcon to CTA button, shortened text to "View Leagues".

**Verification**: `npm run build` passes.
