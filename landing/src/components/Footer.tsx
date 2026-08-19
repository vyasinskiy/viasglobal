"use client";

import React from "react";
import { Box, Container, Typography, Link as MuiLink, Grid, Chip } from "@mui/material";
import Link from "next/link";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  COMPANY_NAME,
  COMPANY_DOMAIN,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_ADDRESS,
  COMPANY_REGISTRATION,
  COMPANY_DETAILS_PDF_URL,
  VIES_VALIDATION_URL,
} from "../config/constants";
import { Locale } from "../i18n/config";

export default function Footer({
  dict,
  legalDict,
  lang,
}: {
  dict: any;
  legalDict: any;
  lang: Locale;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#0f172a",
        color: "#f8fafc",
        pt: { xs: 8, md: 10 },
        pb: 4,
        mt: "auto",
        borderTop: "1px solid #1e293b",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {/* Column 1: Company Profile & Tax ID */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component="img"
              src="/logo.svg"
              alt={`${COMPANY_NAME} Logo`}
              sx={{ height: 38, width: "auto", mb: 2.5, filter: "brightness(0) invert(1)" }}
            />
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2.5, lineHeight: 1.6, maxWidth: 440 }}>
              {dict.desc}
            </Typography>

            <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: "14px !important", color: "#10b981 !important" }} />}
                label={`EU VAT: ${COMPANY_REGISTRATION} (VIES Active)`}
                component="a"
                href={VIES_VALIDATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                size="small"
                sx={{
                  bgcolor: "rgba(16, 185, 129, 0.12)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ display: "block", color: "#64748b", lineHeight: 1.5, maxWidth: 440 }}>
              {dict.legal_info}
            </Typography>
          </Grid>

          {/* Column 2: Direct B2B Contacts */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", mb: 2 }}>
              {dict.contact || "B2B Procurement & Operations"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <EmailIcon sx={{ fontSize: 18, color: "primary.main", mt: 0.3 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                    Official Email
                  </Typography>
                  <MuiLink
                    href={`mailto:${COMPANY_EMAIL}`}
                    sx={{ color: "#e2e8f0", textDecoration: "none", fontSize: "0.9rem", "&:hover": { color: "primary.main" } }}
                  >
                    {COMPANY_EMAIL}
                  </MuiLink>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: 18, color: "primary.main", mt: 0.3 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                    Commercial Desk / WhatsApp
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
                    {COMPANY_PHONE}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: "primary.main", mt: 0.3 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                    Registered Address (Spain / EU)
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    {COMPANY_ADDRESS}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Column 3: Legal & Corporate Documents */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", mb: 2 }}>
              {dict.legal || "Legal & Compliance"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <MuiLink
                component={Link}
                href={`/${lang}/aviso-legal`}
                sx={{ color: "#94a3b8", fontSize: "0.88rem", textDecoration: "none", "&:hover": { color: "#ffffff" } }}
              >
                {legalDict.aviso}
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/${lang}/politica-privacidad`}
                sx={{ color: "#94a3b8", fontSize: "0.88rem", textDecoration: "none", "&:hover": { color: "#ffffff" } }}
              >
                {legalDict.privacidad}
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/${lang}/politica-cookies`}
                sx={{ color: "#94a3b8", fontSize: "0.88rem", textDecoration: "none", "&:hover": { color: "#ffffff" } }}
              >
                {legalDict.cookies}
              </MuiLink>

              <Box sx={{ mt: 1 }}>
                <MuiLink
                  href={`/viasglobal-company-details-${lang}.pdf`}
                  download={`Viasglobal-Company-Details-${lang.toUpperCase()}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "primary.main",
                    fontSize: "0.88rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                  {dict.download_pdf || "Company Profile (PDF)"}
                </MuiLink>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Bar: Copyright & Compliance */}
        <Box
          sx={{
            borderTop: "1px solid #1e293b",
            mt: 6,
            pt: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.82rem" }}>
            &copy; {currentYear} {COMPANY_NAME} ({COMPANY_DOMAIN}). {dict.rights}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.82rem" }}>
            Operated in the European Union (Spain)
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
