// ecommerce/crm/lib/mui-provider.tsx
// Провайдер темы Material UI для клиентских компонентов Next.js
'use client';
import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './mui-theme';

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

