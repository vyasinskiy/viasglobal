import { createTheme } from '@mui/material/styles';
import { COLORS } from '../config/constants';

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary, // #FF9900
      contrastText: '#fff',
    },
    secondary: {
      main: COLORS.secondary, // #232F3E
    },
    background: {
      default: COLORS.background,
      paper: COLORS.lightGray,
    },
    text: {
      primary: COLORS.text,
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
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
