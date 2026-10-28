import { Container, Typography, Box, Divider, Paper } from "@mui/material";
import { COMPANY_NAME } from "../../../config/constants";
import { Locale, i18n } from "../../../i18n/config";
import { LEGAL_NOTICES } from "../../../i18n/legalContent";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const content = LEGAL_NOTICES[lang] || LEGAL_NOTICES.es;

  return {
    title: `${content.title} | ${COMPANY_NAME}`,
    description: content.metaDescription,
  };
}

export default async function AvisoLegal({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const content = LEGAL_NOTICES[lang] || LEGAL_NOTICES.es;

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
        {/* 1. Datos Identificativos */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s1_title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            {content.s1_intro}
          </Typography>

          <Paper variant="outlined" sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 2 }}>
            <Typography variant="body2" component="div" sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <div><strong>{content.fields.owner}</strong></div>
              <div><strong>{content.fields.form}</strong></div>
              <div><strong>{content.fields.tradeName}</strong></div>
              <div><strong>{content.fields.taxId}</strong></div>
              <div><strong>{content.fields.eori}</strong></div>
              <div><strong>{content.fields.address}</strong></div>
              <div><strong>{content.fields.email}</strong></div>
              <div><strong>{content.fields.phone}</strong></div>
              <div><strong>{content.fields.website}</strong></div>
              <div><strong>{content.fields.activity}</strong></div>
            </Typography>
          </Paper>
        </Box>

        {/* 2. Objeto y Ámbito */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s2_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s2_text}
          </Typography>
        </Box>

        {/* 3. Propiedad Intelectual */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s3_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s3_text}
          </Typography>
        </Box>

        {/* 4. Responsabilidad */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s4_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s4_text}
          </Typography>
        </Box>

        {/* 5. Legislación y Fuero */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s5_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s5_text}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
