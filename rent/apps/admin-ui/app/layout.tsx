import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import MuiProvider from '../lib/mui-provider';
import LayoutClient from './layout-client';

export const metadata: Metadata = {
  title: 'Viasglobal Rent',
  description: 'Система учета аренды, коммунальных начислений и платежей',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MuiProvider>
          <LayoutClient>{children}</LayoutClient>
        </MuiProvider>
      </body>
    </html>
  );
}
