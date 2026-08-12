import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "../theme/ThemeRegistry";
import { COMPANY_NAME, COMPANY_DOMAIN } from "../config/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${COMPANY_DOMAIN}`),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ThemeRegistry>
          <main style={{ flexGrow: 1 }}>
            {children}
          </main>
        </ThemeRegistry>
      </body>
    </html>
  );
}

