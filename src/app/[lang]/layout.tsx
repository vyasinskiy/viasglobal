import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import ThemeRegistry from "../../theme/ThemeRegistry";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CookieBanner from "../../components/CookieBanner";
import { COMPANY_NAME, COMPANY_DOMAIN } from "../../config/constants";
import { i18n, Locale } from "../../i18n/config";
import { getDictionary } from "../../i18n/getDictionary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `${COMPANY_NAME} | Wholesale on Amazon`,
    description: `Official site for ${COMPANY_NAME}. We are your reliable B2B wholesale and distribution partner on Amazon.`,
    metadataBase: new URL(`https://${COMPANY_DOMAIN}`),
  };
}

import LanguageSetter from "../../components/LanguageSetter";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <>
      <LanguageSetter lang={lang} />
      <Navbar dict={dict.nav} lang={lang} />
      <div style={{ flexGrow: 1, width: '100%' }}>
        {children}
      </div>
      <Footer dict={dict.footer} legalDict={dict.legal} lang={lang} />
      <CookieBanner dict={dict.cookie} lang={lang} />
    </>
  );
}
