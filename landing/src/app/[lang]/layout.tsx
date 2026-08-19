import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CookieBanner from "../../components/CookieBanner";
import { COMPANY_NAME, COMPANY_DOMAIN } from "../../config/constants";
import { i18n, Locale } from "../../i18n/config";
import { getDictionary } from "../../i18n/getDictionary";
import LanguageSetter from "../../components/LanguageSetter";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  const languages: Record<string, string> = {};
  i18n.locales.forEach((locale) => {
    languages[locale] = `/${locale}`;
  });

  const localeMap: Record<Locale, string> = {
    en: "en_US",
    es: "es_ES",
    de: "de_DE",
    fr: "fr_FR",
    it: "it_IT",
  };

  const ogImageUrl = `https://${COMPANY_DOMAIN}/og-image.jpg`;

  return {
    title: dict.seo.title,
    description: dict.seo.description,
    metadataBase: new URL(`https://${COMPANY_DOMAIN}`),
    alternates: {
      canonical: `/${lang}`,
      languages: languages,
    },
    openGraph: {
      title: dict.seo.title,
      description: dict.seo.description,
      url: `https://${COMPANY_DOMAIN}/${lang}`,
      siteName: COMPANY_NAME,
      locale: localeMap[lang] || "en_US",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${COMPANY_NAME} — European B2B Wholesale & Omnichannel Distribution Partner`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.seo.title,
      description: dict.seo.description,
      images: [ogImageUrl],
    },
  };
}

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
      <Navbar dict={dict.nav} intakeDict={dict.intake_modal} lang={lang} />
      <div style={{ flexGrow: 1, width: "100%" }}>{children}</div>
      <Footer dict={dict.footer} legalDict={dict.legal} lang={lang} />
      <CookieBanner dict={dict.cookie} lang={lang} />
    </>
  );
}
