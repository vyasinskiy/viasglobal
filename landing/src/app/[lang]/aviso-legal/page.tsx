import { Container, Typography, Box } from "@mui/material";
import { COMPANY_NAME, COMPANY_DOMAIN, COMPANY_EMAIL, COMPANY_ADDRESS, COMPANY_REGISTRATION, OWNER_NAME } from "../../../config/constants";
import { getDictionary } from "../../../i18n/getDictionary";
import { Locale, i18n } from "../../../i18n/config";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);
  return {
    title: `${dict.legal.aviso} | ${COMPANY_NAME}`,
  };
}

export default async function AvisoLegal({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        {dict.legal.aviso}
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          1. Información Legal y Aceptación
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSICE), a continuación se exponen los datos identificativos de la empresa:
        </Typography>
        <Typography variant="body1" component="ul" sx={{ pl: 4, mb: 3 }}>
          <li><strong>Titular (Autónomo):</strong> {OWNER_NAME}</li>
          <li><strong>Nombre Comercial:</strong> {COMPANY_NAME}</li>
          <li><strong>NIF/NIE:</strong> {COMPANY_REGISTRATION}</li>
          <li><strong>Domicilio:</strong> {COMPANY_ADDRESS}</li>
          <li><strong>Email de contacto:</strong> {COMPANY_EMAIL}</li>
          <li><strong>Dominio:</strong> {COMPANY_DOMAIN}</li>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          2. Propiedad Intelectual e Industrial
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          El diseño del portal y sus códigos fuente, así como los logos, marcas y demás signos distintivos que aparecen en el mismo pertenecen a {OWNER_NAME} (operando bajo el nombre comercial {COMPANY_NAME}) y están protegidos por los correspondientes derechos de propiedad intelectual e industrial.
        </Typography>
      </Box>
    </Container>
  );
}
