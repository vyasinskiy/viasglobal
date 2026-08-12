import { Container, Typography, Box } from "@mui/material";
import { COMPANY_NAME, OWNER_NAME } from "../../../config/constants";
import { getDictionary } from "../../../i18n/getDictionary";
import { Locale, i18n } from "../../../i18n/config";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);
  return {
    title: `${dict.legal.cookies} | ${COMPANY_NAME}`,
  };
}

export default async function PoliticaCookies({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        {dict.legal.cookies}
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          En {COMPANY_NAME} (operado por {OWNER_NAME}) utilizamos cookies propias y de terceros para mejorar nuestros servicios, personalizar nuestro sitio web y analizar el tráfico de usuarios.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          ¿Qué son las cookies?
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo cuando los visita. Se utilizan ampliamente para que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          ¿Qué tipos de cookies utilizamos?
        </Typography>
        <Typography variant="body1" component="ul" sx={{ pl: 4, mb: 3 }}>
          <li><strong>Cookies Técnicas:</strong> Son necesarias para el funcionamiento del sitio web y no pueden ser desactivadas en nuestros sistemas.</li>
          <li><strong>Cookies Analíticas:</strong> Nos permiten contar las visitas y las fuentes de tráfico para poder evaluar y mejorar el rendimiento de nuestro sitio. Toda la información que recogen estas cookies es agregada y, por lo tanto, anónima.</li>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
          Gestión de Cookies
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Usted puede configurar su navegador para bloquear o alertar sobre estas cookies, pero algunas partes del sitio no funcionarán si lo hace. Puede encontrar información sobre cómo gestionar las cookies en los ajustes de su navegador web.
        </Typography>
      </Box>
    </Container>
  );
}
