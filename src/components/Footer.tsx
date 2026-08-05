"use client";

import React from "react";
import { Box, Container, Typography, Link as MuiLink, Grid } from "@mui/material";
import Link from "next/link";
import { COMPANY_NAME, COMPANY_DOMAIN, COMPANY_EMAIL } from "../config/constants";
import { Locale } from "../i18n/config";

export default function Footer({ dict, legalDict, lang }: { dict: any, legalDict: any, lang: Locale }) {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ bgcolor: "secondary.main", color: "white", py: 6, mt: "auto" }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box 
              component="img"
              src="/viasglobal_logo_2.svg"
              alt={`${COMPANY_NAME} Logo`}
              sx={{ height: 40, width: "auto", mb: 2, filter: "brightness(0) invert(1)" }}
            />
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2, maxWidth: 400 }}>
              {dict.desc}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Email: <MuiLink href={`mailto:${COMPANY_EMAIL}`} color="primary">{COMPANY_EMAIL}</MuiLink>
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{dict.legal}</Typography>
              <MuiLink component={Link} href={`/${lang}/aviso-legal`} color="inherit" underline="hover">
                {legalDict.aviso}
              </MuiLink>
              <MuiLink component={Link} href={`/${lang}/politica-privacidad`} color="inherit" underline="hover">
                {legalDict.privacidad}
              </MuiLink>
              <MuiLink component={Link} href={`/${lang}/politica-cookies`} color="inherit" underline="hover">
                {legalDict.cookies}
              </MuiLink>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", mt: 4, pt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
            &copy; {currentYear} {COMPANY_NAME} ({COMPANY_DOMAIN}). {dict.rights}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
