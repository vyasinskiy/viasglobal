"use client";

import React from "react";
import { AppBar, Toolbar, Button, Container, Box } from "@mui/material";
import Link from "next/link";
import { COMPANY_NAME, COMPANY_EMAIL } from "../config/constants";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale } from "../i18n/config";

export default function Navbar({ dict, lang }: { dict: any, lang: Locale }) {
  return (
    <AppBar position="sticky" color="inherit" sx={{ borderBottom: "1px solid #eaeaea", boxShadow: "none" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          <Box component={Link} href={`/${lang}`} sx={{ display: "flex", alignItems: "center" }}>
            <Box 
              component="img"
              src="/viasglobal_logo_2.svg"
              alt={`${COMPANY_NAME} Logo`}
              sx={{ height: 40, width: "auto" }}
            />
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LanguageSwitcher currentLang={lang} />
            <Button 
              variant="contained" 
              color="primary" 
              href={`mailto:${COMPANY_EMAIL}`}
              sx={{ borderRadius: "20px", px: 3, display: { xs: "none", sm: "block" } }}
            >
              {dict.contact}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
