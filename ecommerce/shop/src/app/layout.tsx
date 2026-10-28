import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CartDrawer } from "@/components/common/CartDrawer";
import { Toast } from "@/components/common/Toast";

export const metadata: Metadata = {
  title: "Viasglobal Store — Tienda Oficial de Tecnología y Confort en España",
  description:
    "Tienda oficial Viasglobal en España. Audio Hi-Res, espacio de trabajo ergonómico y hogar inteligente con envío en 24/48h desde Castellón y Valencia.",
  keywords: [
    "Viasglobal Store",
    "tienda electronica espana",
    "auriculares cancelacion ruido",
    "hogar inteligente Matter",
    "teclado ergonomico",
    "cargador GaN 100W",
    "envio rapido valencia",
  ],
  authors: [{ name: "Vitalii Iasinskii (Viasglobal)" }],
  openGraph: {
    title: "Viasglobal Store — Tecnología, Hogar Inteligente y Confort",
    description:
      "Tienda oficial: electrónica certificada CE/RoHS, entrega en 24/48 horas y 30 días de devolución.",
    siteName: "Viasglobal Store",
    type: "website",
  },
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
    <html lang="es">
      <body>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
        <CartDrawer />
        <Toast />
      </body>
    </html>
  );
}
