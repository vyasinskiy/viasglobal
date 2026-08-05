"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { i18n } from "../i18n/config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Box, CircularProgress, Typography } from "@mui/material";

// Временные словари для страницы редиректа (испанский по умолчанию)
const esDict = {
  nav: { contact: "Contactar", tagline: "CONECTIVIDAD SIN FIN" },
  footer: { desc: "Su socio estratégico en Amazon Wholesale. Conectamos marcas de calidad con clientes en toda Europa.", legal: "Legal", rights: "Todos los derechos reservados." },
  legal: { aviso: "Aviso Legal", privacidad: "Política de Privacidad", cookies: "Política de Cookies" }
};

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const getPreferredLanguage = () => {
      const stored = localStorage.getItem("preferredLanguage");
      if (stored && i18n.locales.includes(stored as any)) {
        return stored;
      }
      const browserLang = navigator.language.split("-")[0];
      if (i18n.locales.includes(browserLang as any)) {
        return browserLang;
      }
      return i18n.defaultLocale;
    };

    const lang = getPreferredLanguage();
    router.replace(`/${lang}`);
  }, [router]);

  return (
    <>
      <Navbar dict={esDict.nav} lang="es" />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 20 }}>
        <CircularProgress color="primary" sx={{ mb: 4 }} />
        <Typography variant="h5">Cargando...</Typography>
      </Box>
      <Footer dict={esDict.footer} legalDict={esDict.legal} lang="es" />
    </>
  );
}
