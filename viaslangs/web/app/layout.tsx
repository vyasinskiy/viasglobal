import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "../src/theme/ThemeRegistry";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIAS-Langs",
  description: "VIAS - Langs learning application",
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