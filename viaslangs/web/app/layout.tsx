import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "../src/theme/ThemeRegistry";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Настройки viewport для корректного масштабирования на мобильных экранах
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F172A",
};

export const metadata: Metadata = {
  title: "Viasglobal Langs",
  description: "Private vocabulary and language learning application",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <ThemeRegistry>
          <main style={{ flexGrow: 1, width: "100%" }}>
            {children}
          </main>
        </ThemeRegistry>
      </body>
    </html>
  );
}