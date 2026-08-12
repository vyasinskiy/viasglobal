"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Link as MuiLink } from "@mui/material";
import Link from "next/link";
import { COLORS } from "../config/constants";
import { Locale } from "../i18n/config";

export default function CookieBanner({ dict, lang }: { dict: any, lang: Locale }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
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
        backgroundColor: COLORS.secondary,
        color: "#fff",
        p: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 9999,
        boxShadow: "0 -4px 10px rgba(0,0,0,0.2)",
      }}
    >
      <Typography variant="body2" sx={{ mb: { xs: 2, md: 0 }, mr: { md: 2 } }}>
        {dict.text}{" "}
        <MuiLink component={Link} href={`/${lang}/politica-cookies`} color="primary">
          {dict.policy}
        </MuiLink>.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={acceptCookies}
        sx={{ whiteSpace: "nowrap" }}
      >
        {dict.accept}
      </Button>
    </Box>
  );
}
