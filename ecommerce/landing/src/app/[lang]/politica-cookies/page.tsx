import { Container, Typography, Box, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Link as MuiLink } from "@mui/material";
import { COMPANY_NAME, COMPANY_EMAIL } from "../../../config/constants";
import { Locale, i18n } from "../../../i18n/config";
import { COOKIE_POLICIES } from "../../../i18n/legalContent";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const content = COOKIE_POLICIES[lang] || COOKIE_POLICIES.es;

  return {
    title: `${content.title} | ${COMPANY_NAME}`,
    description: content.metaDescription,
  };
}

export default async function PoliticaCookies({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const content = COOKIE_POLICIES[lang] || COOKIE_POLICIES.es;

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
        {/* 1. ¿Qué son las cookies? */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s1_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s1_text}
          </Typography>
        </Box>

        {/* 2. Tipos de Cookies Utilizadas */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s2_title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, color: "text.secondary" }}>
            {content.s2_intro}
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{content.table_header_type}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{content.table_header_purpose}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{content.table_header_duration}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{content.table_header_management}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{content.cookie_tech_type}</TableCell>
                  <TableCell>{content.cookie_tech_purpose}</TableCell>
                  <TableCell>{content.cookie_tech_duration}</TableCell>
                  <TableCell>{content.cookie_tech_mgmt}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{content.cookie_anal_type}</TableCell>
                  <TableCell>{content.cookie_anal_purpose}</TableCell>
                  <TableCell>{content.cookie_anal_duration}</TableCell>
                  <TableCell>{content.cookie_anal_mgmt}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 3. Base Jurídica */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s3_title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
            {content.s3_text}
          </Typography>
        </Box>

        {/* 4. Desactivación */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "secondary.main" }}>
            {content.s4_title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: "text.secondary" }}>
            {content.s4_intro}
          </Typography>
          <Typography variant="body1" component="ul" sx={{ pl: 4, display: "flex", flexDirection: "column", gap: 1, color: "text.secondary" }}>
            <li><strong>Google Chrome:</strong> <MuiLink href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome Cookie Settings</MuiLink></li>
            <li><strong>Mozilla Firefox:</strong> <MuiLink href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Firefox Cookie Settings</MuiLink></li>
            <li><strong>Apple Safari:</strong> <MuiLink href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari Cookie Settings</MuiLink></li>
            <li><strong>Microsoft Edge:</strong> <MuiLink href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge Cookie Settings</MuiLink></li>
          </Typography>
        </Box>

        {/* 5. Contacto */}
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
