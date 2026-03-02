import { createTheme, type Theme } from "@mui/material/styles";

// ── Smash Bros accent colors (shared across all themes) ──
export const SMASH_COLORS = {
  p1Red: "#E53935",
  p2Blue: "#1E88E5",
  p3Yellow: "#FDD835",
  p4Green: "#43A047",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

// ── Per-theme metadata (gradient, navbar, surface colors) ──
export type ThemeMeta = {
  id: string;
  label: string;
  emoji: string;
  navGradient: string;
  heroGradient: string;
  cardBg: string;
  surfaceTint: string; // subtle tint for papers/surfaces
  accentGradient: string; // for buttons, CTA elements
};

// ── Shared MUI component overrides ──
function sharedComponents(mode: "light" | "dark") {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: "background-color 0.3s ease, color 0.3s ease",
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: mode === "dark" ? 4 : 2 },
      styleOverrides: {
        root: {
          transition: "box-shadow 0.2s ease, transform 0.15s ease, background-color 0.3s ease",
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: "background-color 0.3s ease, box-shadow 0.2s ease",
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none" as const,
          "&:focus-visible": { outlineOffset: 2 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          transition: "background-color 0.3s ease",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none" as const,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          transition: "background 0.3s ease",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  } as const;
}

const sharedTypography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
};

// ═══════════════════════════════════════════════════
// 1. DARK GAMER — default. Dark backgrounds, Smash fire accents
// ═══════════════════════════════════════════════════
export const darkGamerMeta: ThemeMeta = {
  id: "dark-gamer",
  label: "Dark Gamer",
  emoji: "🎮",
  navGradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 40%, #E53935 100%)",
  heroGradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 35%, #16213e 60%, #E53935 100%)",
  cardBg: "#1e1e2f",
  surfaceTint: "rgba(229, 57, 53, 0.04)",
  accentGradient: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p3Yellow})`,
};

export const darkGamerTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#E53935", light: "#FF6F60", dark: "#AB000D" },
    secondary: { main: "#FDD835", light: "#FFFF6B", dark: "#C6A700" },
    background: { default: "#0e0e1a", paper: "#1a1a2e" },
    success: { main: "#43A047", light: "#76D275" },
    error: { main: "#E53935", light: "#FF6F60" },
    warning: { main: "#FDD835", light: "#FFFF6B" },
    info: { main: "#1E88E5", light: "#6AB7FF" },
    text: { primary: "#E8E8F0", secondary: "#A0A0B8" },
    divider: "rgba(255,255,255,0.12)",
  },
  typography: sharedTypography,
  components: sharedComponents("dark"),
});

// ═══════════════════════════════════════════════════
// 2. CLASSIC SMASH — Light mode, bold primary colors
// ═══════════════════════════════════════════════════
export const classicSmashMeta: ThemeMeta = {
  id: "classic-smash",
  label: "Classic Smash",
  emoji: "⚡",
  navGradient: `linear-gradient(135deg, #0f3460 0%, #1a1a2e 55%, ${SMASH_COLORS.p1Red} 100%)`,
  heroGradient: `linear-gradient(135deg, #1a1a2e 0%, #0f3460 55%, ${SMASH_COLORS.p1Red} 100%)`,
  cardBg: "#ffffff",
  surfaceTint: "rgba(15, 52, 96, 0.03)",
  accentGradient: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
};

export const classicSmashTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f3460", light: "#C0DEFA", dark: "#082040" },
    secondary: { main: "#E53935", light: "#FFCDD2" },
    background: { default: "#f0f0f5", paper: "#ffffff" },
    success: { main: "#43A047", light: "#C8E6C9" },
    error: { main: "#E53935", light: "#FFCDD2" },
    warning: { main: "#FDD835" },
    info: { main: "#1E88E5" },
  },
  typography: sharedTypography,
  components: sharedComponents("light"),
});

// ═══════════════════════════════════════════════════
// 3. OCEAN BLUE — Cool, deep-sea dark theme
// ═══════════════════════════════════════════════════
export const oceanBlueMeta: ThemeMeta = {
  id: "ocean-blue",
  label: "Ocean Blue",
  emoji: "🌊",
  navGradient: "linear-gradient(135deg, #0a192f 0%, #0d2137 50%, #1565C0 100%)",
  heroGradient: "linear-gradient(135deg, #0a192f 0%, #0d2137 35%, #1565C0 70%, #42A5F5 100%)",
  cardBg: "#112240",
  surfaceTint: "rgba(21, 101, 192, 0.05)",
  accentGradient: "linear-gradient(135deg, #1565C0, #42A5F5)",
};

export const oceanBlueTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#42A5F5", light: "#80D6FF", dark: "#1565C0" },
    secondary: { main: "#26C6DA", light: "#6FF9FF", dark: "#0095A8" },
    background: { default: "#0a192f", paper: "#112240" },
    success: { main: "#66BB6A", light: "#98EE99" },
    error: { main: "#EF5350", light: "#FF867C" },
    warning: { main: "#FFA726", light: "#FFD95B" },
    info: { main: "#29B6F6", light: "#73E8FF" },
    text: { primary: "#CCD6F6", secondary: "#8892B0" },
    divider: "rgba(100,150,255,0.12)",
  },
  typography: sharedTypography,
  components: sharedComponents("dark"),
});

// ═══════════════════════════════════════════════════
// 4. NEON ARCADE — Cyberpunk neon on black
// ═══════════════════════════════════════════════════
export const neonArcadeMeta: ThemeMeta = {
  id: "neon-arcade",
  label: "Neon Arcade",
  emoji: "👾",
  navGradient: "linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 50%, #e040fb 100%)",
  heroGradient: "linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 30%, #e040fb 65%, #00e5ff 100%)",
  cardBg: "#1a1025",
  surfaceTint: "rgba(224, 64, 251, 0.05)",
  accentGradient: "linear-gradient(135deg, #e040fb, #00e5ff)",
};

export const neonArcadeTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#e040fb", light: "#FF79FF", dark: "#AA00C7" },
    secondary: { main: "#00e5ff", light: "#6EFFFF", dark: "#00B2CC" },
    background: { default: "#0d0d0d", paper: "#1a1025" },
    success: { main: "#76FF03", light: "#B0FF57" },
    error: { main: "#FF1744", light: "#FF616F" },
    warning: { main: "#FFEA00", light: "#FFFF56" },
    info: { main: "#00e5ff", light: "#6EFFFF" },
    text: { primary: "#F0E6FF", secondary: "#B0A0C8" },
    divider: "rgba(224, 64, 251, 0.15)",
  },
  typography: sharedTypography,
  components: sharedComponents("dark"),
});

// ═══════════════════════════════════════════════════
// 5. MONOCHROME — Clean, minimal dark grey
// ═══════════════════════════════════════════════════
export const monochromeMeta: ThemeMeta = {
  id: "monochrome",
  label: "Monochrome",
  emoji: "🖤",
  navGradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 60%, #424242 100%)",
  heroGradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #424242 70%, #616161 100%)",
  cardBg: "#242424",
  surfaceTint: "rgba(255,255,255,0.02)",
  accentGradient: "linear-gradient(135deg, #757575, #BDBDBD)",
};

export const monochromeTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#BDBDBD", light: "#EFEFEF", dark: "#8D8D8D" },
    secondary: { main: "#E0E0E0", light: "#FFFFFF", dark: "#AEAEAE" },
    background: { default: "#121212", paper: "#1e1e1e" },
    success: { main: "#81C784", light: "#B2FAB4" },
    error: { main: "#E57373", light: "#FFA4A2" },
    warning: { main: "#FFD54F", light: "#FFFF81" },
    info: { main: "#90CAF9", light: "#C3FDFF" },
    text: { primary: "#E0E0E0", secondary: "#9E9E9E" },
    divider: "rgba(255,255,255,0.08)",
  },
  typography: sharedTypography,
  components: sharedComponents("dark"),
});

// ═══════════════════════════════════════════════════
// Theme registry — used by ThemeContext
// ═══════════════════════════════════════════════════
export type ThemeEntry = { theme: Theme; meta: ThemeMeta };

export const THEMES: Record<string, ThemeEntry> = {
  "dark-gamer": { theme: darkGamerTheme, meta: darkGamerMeta },
  "classic-smash": { theme: classicSmashTheme, meta: classicSmashMeta },
  "ocean-blue": { theme: oceanBlueTheme, meta: oceanBlueMeta },
  "neon-arcade": { theme: neonArcadeTheme, meta: neonArcadeMeta },
  monochrome: { theme: monochromeTheme, meta: monochromeMeta },
};

export const DEFAULT_THEME_ID = "dark-gamer";

// ── Legacy export for backwards compat during migration ──
export const theme = darkGamerTheme;
export const APP_GRADIENT = darkGamerMeta.heroGradient;
