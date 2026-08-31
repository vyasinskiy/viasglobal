import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CartDrawer } from "@/components/common/CartDrawer";
import { Toast } from "@/components/common/Toast";

export const metadata: Metadata = {
  title: "Viasglobal Store — Премиальная электроника, умный дом и аксессуары в ЕС",
  description:
    "Официальный интернет-магазин Viasglobal в Испании и Европе. Премиальные наушники, эргономичные устройства для рабочего места, умный дом и быстрая доставка со складов в ЕС.",
  keywords: [
    "Viasglobal Store",
    "интернет-магазин электроники ЕС",
    "наушники с шумоподавлением",
    "умный дом Matter",
    "эргономичная клавиатура",
    "GaN зарядка 100W",
    "доставка по Испании",
  ],
  authors: [{ name: "Vitalii Iasinskii (Viasglobal)" }],
  openGraph: {
    title: "Viasglobal Store — Премиальная электроника и аксессуары в ЕС",
    description:
      "Официальный интернет-магазин: быстрая доставка за 24-48 часов, 2 года гарантии ЕС, скидка 10% по промокоду VIAS10.",
    siteName: "Viasglobal Store",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
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
