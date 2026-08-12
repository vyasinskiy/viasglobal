import { Container, Typography, Box, Button, Grid, Card, CardContent } from "@mui/material";
import { COMPANY_EMAIL, COMPANY_NAME } from "../../config/constants";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { getDictionary } from "../../i18n/getDictionary";
import { Locale, i18n } from "../../i18n/config";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as Locale);

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        className="bg-gradient-primary"
        sx={{ 
          py: { xs: 10, md: 16 },
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Container maxWidth="lg" className="animate-fade-in">
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  letterSpacing: "-1px",
                  lineHeight: 1.1
                }}
              >
                {dict.home.hero_title_1}<span style={{ color: "var(--primary)" }}>{dict.home.hero_title_2}</span>
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ mb: 4, fontWeight: 400, color: "rgba(255,255,255,0.8)", maxWidth: "600px" }}
              >
                {dict.home.hero_subtitle}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                href={`mailto:${COMPANY_EMAIL}`}
                sx={{ 
                  borderRadius: "30px", 
                  px: 4, 
                  py: 1.5, 
                  fontSize: "1.1rem",
                  boxShadow: "0 10px 20px rgba(255, 153, 0, 0.3)"
                }}
              >
                {dict.home.hero_cta}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: "none", md: "block" } }}>
              <Box className="glass-panel" sx={{ p: 4, textAlign: "center" }}>
                <StorefrontIcon sx={{ fontSize: 120, color: "var(--primary)" }} />
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>{dict.home.badge_title}</Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}>
                  {dict.home.badge_desc}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 800, mb: 6 }}>
          {dict.services.title}
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <LocalShippingIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                  {dict.services.s1_title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {dict.services.s1_desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <StorefrontIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                  {dict.services.s2_title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {dict.services.s2_desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <TrendingUpIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                  {dict.services.s3_title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {dict.services.s3_desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: "var(--light-gray)", py: { xs: 8, md: 10 }, textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            {dict.cta.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "text.secondary", fontSize: "1.1rem" }}>
            {dict.cta.desc}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            href={`mailto:${COMPANY_EMAIL}`}
            sx={{ borderRadius: "30px", px: 5, py: 1.5, fontSize: "1.1rem" }}
          >
            {dict.cta.button}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
