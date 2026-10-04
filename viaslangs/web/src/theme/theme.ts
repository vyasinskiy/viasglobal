import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: '#10B981',
          light: '#34D399',
          dark: '#059669',
          contrastText: '#fff',
        },
        secondary: {
          main: '#1E293B',
          dark: '#0F172A',
        },
        background: {
          default: '#0F172A',
          paper: '#1E293B',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          disabled: '#64748B',
        },
        divider: 'rgba(148, 163, 184, 0.25)',
      },
    },
  },
  defaultColorScheme: 'dark',
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