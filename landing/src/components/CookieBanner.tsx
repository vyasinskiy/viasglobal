"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Link as MuiLink } from "@mui/material";
import Link from "next/link";
import { Locale } from "../i18n/config";

export default function CookieBanner({ dict, lang }: { dict: any; lang: Locale }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (type: "all" | "essential") => {
    localStorage.setItem("cookieConsent", type);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#0f172a",
        color: "#ffffff",
        p: { xs: 2.5, md: 3 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        zIndex: 9999,
        boxShadow: "0 -8px 24px rgba(0,0,0,0.3)",
        borderTop: "1px solid #1e293b",
        gap: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: "#cbd5e1", lineHeight: 1.6, maxWidth: 850 }}>
        {dict.text}{" "}
        <MuiLink
          component={Link}
          href={`/${lang}/politica-cookies`}
          sx={{ color: "primary.main", fontWeight: 600, textDecoration: "underline" }}
        >
          {dict.policy}
        </MuiLink>
        .
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0, justifyContent: { xs: "stretch", sm: "flex-end" } }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleConsent("essential")}
          sx={{
            borderRadius: "20px",
            borderColor: "#475569",
            color: "#e2e8f0",
            textTransform: "none",
            px: 2,
            "&:hover": { borderColor: "#94a3b8", bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          {dict.reject_non_essential || "Reject Non-Essential"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleConsent("all")}
          sx={{
            borderRadius: "20px",
            fontWeight: 700,
            textTransform: "none",
            px: 3,
            whiteSpace: "nowrap",
          }}
        >
          {dict.accept_all || "Accept All"}
        </Button>
      </Box>
    </Box>
  );
}
