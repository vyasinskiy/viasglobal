import { createTheme } from '@mui/material/styles';
import { COLORS } from '../config/constants';

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary, // #FF9900
      dark: COLORS.primaryDark,
      contrastText: '#fff',
    },
    secondary: {
      main: COLORS.secondary, // #1E293B
      dark: COLORS.secondaryDark,
    },
    background: {
      default: COLORS.background,
      paper: COLORS.paper,
    },
    text: {
      primary: COLORS.text,
      secondary: COLORS.textSecondary,
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 800,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
