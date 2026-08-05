import { Container, Typography, Box } from "@mui/material";
import { COMPANY_NAME, COMPANY_EMAIL, OWNER_NAME } from "../../../config/constants";
import { getDictionary } from "../../../i18n/getDictionary";
import { Locale, i18n } from "../../../i18n/config";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);
  return {
    title: `${dict.legal.privacidad} | ${COMPANY_NAME}`,
  };
}

export default async function PoliticaPrivacidad({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        {dict.legal.privacidad}
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          De conformidad con lo dispuesto en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), le informamos sobre el tratamiento de sus datos personales.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          1. Responsable del Tratamiento
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          El responsable del tratamiento de sus datos es {OWNER_NAME} (operando bajo el nombre comercial {COMPANY_NAME}), con correo electrónico de contacto: {COMPANY_EMAIL}.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          2. Finalidad del Tratamiento
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Tratamos la información que nos facilita con el fin de prestarle el servicio solicitado, gestionar sus consultas de contacto y realizar la facturación correspondiente. Los datos proporcionados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          3. Derechos de los Usuarios
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Usted tiene derecho a obtener confirmación sobre si en {COMPANY_NAME} estamos tratando sus datos personales por tanto tiene derecho a acceder a sus datos personales, rectificar los datos inexactos o solicitar su supresión cuando los datos ya no sean necesarios. Puede ejercer estos derechos enviando un correo a {COMPANY_EMAIL}.
        </Typography>
      </Box>
    </Container>
  );
}
