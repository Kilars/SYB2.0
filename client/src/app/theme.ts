import { createTheme } from '@mui/material/styles';

// Smash Bros player colors
export const SMASH_COLORS = {
  p1Red: '#E53935',
  p2Blue: '#1E88E5',
  p3Yellow: '#FDD835',
  p4Green: '#43A047',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

// Smash-inspired fiery gradient (dark navy into crimson red)
export const APP_GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 55%, #E53935 100%)';

export const theme = createTheme({
  palette: {
    primary: { main: '#0f3460', light: '#C0DEFA' },
    secondary: { main: '#E53935' },
    background: { default: '#f0f0f5' },
    success: { main: '#43A047', light: '#C8E6C9' },
    error: { main: '#E53935', light: '#FFCDD2' },
    warning: { main: '#FDD835' },
    info: { main: '#1E88E5' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: { defaultProps: { elevation: 2 } },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});
