import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { THEMES, DEFAULT_THEME_ID, type ThemeMeta } from '../theme';
import type { Theme } from '@mui/material/styles';

const STORAGE_KEY = 'syb-theme';

type ThemeContextType = {
  themeId: string;
  setThemeId: (id: string) => void;
  meta: ThemeMeta;
  muiTheme: Theme;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getStoredThemeId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES[stored]) return stored;
  } catch { /* SSR / private browsing */ }
  return DEFAULT_THEME_ID;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(getStoredThemeId);

  const setThemeId = useCallback((id: string) => {
    if (!THEMES[id]) return;
    setThemeIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const entry = THEMES[themeId] ?? THEMES[DEFAULT_THEME_ID];

  const value = useMemo(() => ({
    themeId,
    setThemeId,
    meta: entry.meta,
    muiTheme: entry.theme,
  }), [themeId, setThemeId, entry]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={entry.theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
