'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#7c4dff' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } } },
  },
});

export default theme;