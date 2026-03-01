import { createTheme } from '@mui/material/styles';

export const APP_GRADIENT = 'linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)';

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
