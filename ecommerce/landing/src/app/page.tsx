"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { i18n, Locale } from "../i18n/config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Box, CircularProgress, Typography } from "@mui/material";

// Временные словари для страницы редиректа (испанский по умолчанию)
const esFallbackDict = {
  nav: {
    capabilities: "Capacidades",
    categories: "Especialización",
    standards: "Estándares",
    how_we_work: "Cómo Trabajamos",
    download_pdf: "Perfil de Empresa (PDF)",
    become_partner: "Ser Partner B2B",
    contact: "Contacto",
    tagline: "DISTRIBUCIÓN COMERCIAL Y ESCALADO DE MARCAS",
  },
  intake_modal: {
    title: "Formulario de Integración B2B",
    subtitle: "Envíe los datos de su empresa y catálogo para iniciar la colaboración comercial.",
    full_name: "Nombre de Contacto",
    full_name_placeholder: "Ej. Carlos Gómez",
    company_name: "Nombre de la Empresa / Marca",
    company_name_placeholder: "Ej. Distribuciones Ibéricas S.L.",
    email: "Email Corporativo",
    email_placeholder: "ventas@empresa.com",
    phone: "Teléfono / WhatsApp (Opcional)",
    phone_placeholder: "+34 600 000 000",
    category_label: "Categoría Principal de Producto",
    category_placeholder: "Seleccione una categoría",
    order_volume_label: "Alcance del Catálogo / Pedido Mínimo (MOV)",
    order_volume_placeholder: "Ej. Catálogo de 150 referencias, MOV 1.000€",
    map_policy_label: "¿Dispone de política de PVP / MAP?",
    map_policy_yes: "Sí, disponemos de política estricta de PVP / MAP",
    map_policy_no: "Sin política formal, pero priorizamos estabilidad de precios",
    map_policy_na: "No aplica",
    message_label: "Mensaje / Enlace al Catálogo",
    message_placeholder: "Indique enlaces al catálogo o condiciones mayoristas...",
    gdpr_agreement: "He leído y acepto la",
    privacy_link_text: "Política de Privacidad",
    submit_button: "Enviar Solicitud B2B",
    submitting: "Procesando...",
    success_title: "Solicitud Recibida Correctamente",
    success_desc: "Gracias por contactar con Viasglobal.",
    close_button: "Cerrar",
  },
  footer: {
    desc: "Distribuidor Mayorista B2B y Partner de Comercio Digital en Europa.",
    legal_info: "Viasglobal es un nombre comercial registrado de Vitalii Iasinskii (Autónomo). NIF / IVA UE: ESZ1154366R.",
    legal: "Legal y Cumplimiento",
    rights: "Todos los derechos reservados.",
    download_pdf: "Perfil de Empresa (PDF)",
  },
  legal: {
    aviso: "Aviso Legal",
    privacidad: "Política de Privacidad (RGPD)",
    cookies: "Política de Cookies",
  },
};

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const getPreferredLanguage = (): Locale => {
      const stored = localStorage.getItem("preferredLanguage");
      if (stored && i18n.locales.includes(stored as Locale)) {
        return stored as Locale;
      }
      const browserLang = navigator.language.split("-")[0] as Locale;
      if (i18n.locales.includes(browserLang)) {
        return browserLang;
      }
      return i18n.defaultLocale;
    };

    const lang = getPreferredLanguage();
    router.replace(`/${lang}`);
  }, [router]);

  return (
    <>
      <Navbar dict={esFallbackDict.nav} intakeDict={esFallbackDict.intake_modal} lang="es" />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 20,
          bgcolor: "#f8fafc",
        }}
      >
        <CircularProgress color="primary" sx={{ mb: 3 }} />
        <Typography variant="h6" sx={{ color: "text.secondary" }}>
          Cargando portal comercial...
        </Typography>
      </Box>
      <Footer dict={esFallbackDict.footer} legalDict={esFallbackDict.legal} lang="es" />
    </>
  );
}
