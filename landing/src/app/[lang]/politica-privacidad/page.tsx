import { Container, Typography, Box, Divider, Paper, Link as MuiLink } from "@mui/material";
import {
  COMPANY_NAME,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_ADDRESS,
  COMPANY_REGISTRATION,
  COMPANY_LEGAL_FORM,
  OWNER_NAME,
} from "../../../config/constants";
import { Locale, i18n } from "../../../i18n/config";
import { PRIVACY_POLICIES } from "../../../i18n/legalContent";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const content = PRIVACY_POLICIES[lang] || PRIVACY_POLICIES.es;

  return {
    title: `${content.title} | ${COMPANY_NAME}`,
    description: content.metaDescription,
  };
}

export default async function PoliticaPrivacidad({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const content = PRIVACY_POLICIES[lang] || PRIVACY_POLICIES.es;

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: "secondary.main" }}>
        {content.title}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {content.subtitle}
      </Typography>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* 1. Responsable del Tratamiento */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s1_title}
          </Typography>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 2 }}>
            <Typography variant="body2" component="div" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div><strong>Owner / Entity:</strong> {OWNER_NAME} ({COMPANY_NAME})</div>
              <div><strong>Legal Form:</strong> {COMPANY_LEGAL_FORM}</div>
              <div><strong>Tax ID / EU VAT:</strong> {COMPANY_REGISTRATION}</div>
              <div><strong>Address:</strong> {COMPANY_ADDRESS}</div>
              <div><strong>Phone:</strong> {COMPANY_PHONE}</div>
              <div><strong>Privacy Email:</strong> {COMPANY_EMAIL}</div>
            </Typography>
          </Paper>
        </Box>

        {/* 2. Finalidades del Tratamiento */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s2_title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            {content.s2_intro}
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4, display: "flex", flexDirection: "column", gap: 1, color: "text.secondary" }}>
            {content.s2_bullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </Typography>
        </Box>

        {/* 3. Base Jurídica */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s3_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s3_intro}
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4, mt: 1, display: "flex", flexDirection: "column", gap: 1, color: "text.secondary" }}>
            {content.s3_bullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </Typography>
        </Box>

        {/* 4. Plazos de Conservación */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s4_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s4_text}
          </Typography>
        </Box>

        {/* 5. Destinatarios */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s5_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s5_text}
          </Typography>
        </Box>

        {/* 6. Derechos del Usuario */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s6_title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: "text.secondary" }}>
            {content.s6_intro}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Email:</strong> <MuiLink href={`mailto:${COMPANY_EMAIL}`} color="primary">{COMPANY_EMAIL}</MuiLink><br />
              <strong>Subject:</strong> Exercise of Data Protection Rights (GDPR)
            </Typography>
          </Paper>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s6_aepd}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
