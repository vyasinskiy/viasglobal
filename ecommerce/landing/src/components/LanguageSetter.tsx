"use client";
import { useEffect } from "react";
import { Locale } from "../i18n/config";

export default function LanguageSetter({ lang }: { lang: Locale }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("preferredLanguage", lang);
  }, [lang]);
  return null;
}
