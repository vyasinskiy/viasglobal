import { Container, Typography, Box, Grid, Card, CardContent, Chip } from "@mui/material";
import { getDictionary } from "../../i18n/getDictionary";
import { Locale, i18n } from "../../i18n/config";
import ViesBadge from "../../components/ViesBadge";
import PartnerCtaButtons from "../../components/PartnerCtaButtons";
import RegionalNetworkMap from "../../components/RegionalNetworkMap";
import MarketplacesSection from "../../components/MarketplacesSection";

// Icons
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import GppGoodIcon from "@mui/icons-material/GppGood";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import PublicIcon from "@mui/icons-material/Public";
import HandshakeIcon from "@mui/icons-material/Handshake";

// Category Icons
import KitchenIcon from "@mui/icons-material/Kitchen";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import SpaIcon from "@mui/icons-material/Spa";
import BuildIcon from "@mui/icons-material/Build";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  const categories = [
    { title: dict.categories.c1_title, desc: dict.categories.c1_desc, icon: KitchenIcon, color: "#f59e0b" },
    { title: dict.categories.c2_title, desc: dict.categories.c2_desc, icon: FitnessCenterIcon, color: "#10b981" },
    { title: dict.categories.c3_title, desc: dict.categories.c3_desc, icon: DevicesOtherIcon, color: "#3b82f6" },
    { title: dict.categories.c4_title, desc: dict.categories.c4_desc, icon: SpaIcon, color: "#ec4899" },
    { title: dict.categories.c5_title, desc: dict.categories.c5_desc, icon: BuildIcon, color: "#8b5cf6" },
    { title: dict.categories.c6_title, desc: dict.categories.c6_desc, icon: BusinessCenterIcon, color: "#06b6d4" },
  ];

  const capabilities = [
    {
      title: dict.capabilities.s1_title,
      desc: dict.capabilities.s1_desc,
      icon: StorefrontIcon,
    },
    {
      title: dict.capabilities.s2_title,
      desc: dict.capabilities.s2_desc,
      icon: GppGoodIcon,
    },
    {
      title: dict.capabilities.s3_title,
      desc: dict.capabilities.s3_desc,
      icon: TrendingUpIcon,
    },
    {
      title: dict.capabilities.s4_title,
      desc: dict.capabilities.s4_desc,
      icon: LocalShippingIcon,
    },
  ];

  const standards = [
    {
      title: dict.standards.std1_title,
      desc: dict.standards.std1_desc,
      icon: PriceCheckIcon,
      accent: "#f59e0b",
    },
    {
      title: dict.standards.std2_title,
      desc: dict.standards.std2_desc,
      icon: LocalShippingIcon,
      accent: "#3b82f6",
    },
    {
      title: dict.standards.std3_title,
      desc: dict.standards.std3_desc,
      icon: PublicIcon,
      accent: "#10b981",
    },
    {
      title: dict.standards.std4_title,
      desc: dict.standards.std4_desc,
      icon: HandshakeIcon,
      accent: "#8b5cf6",
    },
  ];

  const steps = [
    {
      num: dict.how_we_work.step1_num,
      title: dict.how_we_work.step1_title,
      desc: dict.how_we_work.step1_desc,
    },
    {
      num: dict.how_we_work.step2_num,
      title: dict.how_we_work.step2_title,
      desc: dict.how_we_work.step2_desc,
    },
    {
      num: dict.how_we_work.step3_num,
      title: dict.how_we_work.step3_title,
      desc: dict.how_we_work.step3_desc,
    },
    {
      num: dict.how_we_work.step4_num,
      title: dict.how_we_work.step4_title,
      desc: dict.how_we_work.step4_desc,
    },
  ];

  return (
    <Box sx={{ width: "100%", overflowX: "hidden" }}>
      {/* 1. Hero Section */}
      <Box
        sx={{
          bgcolor: "#0f172a",
          color: "#ffffff",
          py: { xs: 8, md: 14 },
          position: "relative",
          backgroundImage: "radial-gradient(ellipse at 80% 20%, rgba(37, 99, 235, 0.15), transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(255, 153, 0, 0.08), transparent 40%)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              {/* Trust Badge / VIES verification */}
              <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                <ViesBadge
                  label={dict.home.vies_badge}
                  tooltipText={dict.home.vies_tooltip}
                  verifyText={dict.home.vies_verify}
                />
                <Chip
                  label="Spain (EU) • B2B Vendor Profile"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    color: "#cbd5e1",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "2.3rem", sm: "3.2rem", md: "3.8rem" },
                  letterSpacing: "-1.5px",
                  lineHeight: 1.15,
                  color: "#f8fafc",
                }}
              >
                {dict.home.hero_title_1}
                <Box component="span" sx={{ color: "primary.main", display: "inline" }}>
                  {dict.home.hero_title_accent}
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  fontSize: { xs: "1.05rem", md: "1.2rem" },
                  lineHeight: 1.65,
                  color: "#94a3b8",
                  maxWidth: "640px",
                }}
              >
                {dict.home.hero_subtitle}
              </Typography>

              {/* Action Buttons */}
              <PartnerCtaButtons
                partnerLabel={dict.home.hero_cta_partner}
                pdfLabel={dict.home.hero_cta_pdf}
                intakeDict={dict.intake_modal}
                lang={lang}
                variant="hero"
              />

              {/* 4 Bullet Highlights */}
              <Box sx={{ mt: 5, pt: 3, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexWrap: "wrap", gap: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 600 }}>
                    {dict.home.highlights.eu_operator}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 600 }}>
                    {dict.home.highlights.map_strict}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 600 }}>
                    {dict.home.highlights.fast_sepa}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 600 }}>
                    {dict.home.highlights.inbound_logistics}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Card / Commercial Summary */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  bgcolor: "rgba(30, 41, 59, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 4,
                  p: { xs: 3, sm: 4 },
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: "rgba(255, 153, 0, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                    }}
                  >
                    <PublicIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>
                      Viasglobal Commercial Desk
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Spain & Cross-Border EU Operations
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ bgcolor: "rgba(15, 23, 42, 0.6)", p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Trade & Fiscal Framework
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#f8fafc", mt: 0.3 }}>
                      VIES Registered • Intra-Community 0% VAT
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: "rgba(15, 23, 42, 0.6)", p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Commercial Policy & Standards
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#f8fafc", mt: 0.3 }}>
                      Strict MAP / RRP Adherence • Brand Equity Protection
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: "rgba(15, 23, 42, 0.6)", p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Commercial Delivery Terms
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#f8fafc", mt: 0.3 }}>
                      DAP / DDP Preferred • Door-to-Door Intake
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. Product Categories & Focus Areas (Белый фон) */}
      <Box id="categories" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#ffffff" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 7, maxWidth: 760, mx: "auto" }}>
            <Chip
              label="Focus Sectors"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, mb: 1.5, borderRadius: "6px" }}
            />
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "#0f172a", mb: 2, fontSize: { xs: "2rem", md: "2.6rem" } }}>
              {dict.categories.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
              {dict.categories.subtitle}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {categories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      p: 3.5,
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid #f1f5f9",
                      bgcolor: "#f8fafc",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: "#ffffff",
                        borderColor: "#cbd5e1",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${cat.color}15`,
                        color: cat.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <IconComp sx={{ fontSize: 26 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#0f172a" }}>
                      {cat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {cat.desc}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* 3. Regional Distribution Network & Local Partner Hub (Comunidad Valenciana) */}
      <Box id="network">
        <RegionalNetworkMap
          badge={dict.regional_network.badge}
          title={dict.regional_network.title}
          subtitle={dict.regional_network.subtitle}
          stats={{
            points_num: dict.regional_network.stats_points_num,
            points_label: dict.regional_network.stats_points_label,
            coverage_num: dict.regional_network.stats_coverage_num,
            coverage_label: dict.regional_network.stats_coverage_label,
            transit_num: dict.regional_network.stats_transit_num,
            transit_label: dict.regional_network.stats_transit_label,
          }}
          filterLabels={{
            all: dict.regional_network.filter_all,
            retail: dict.regional_network.filter_retail,
            logistics: dict.regional_network.filter_logistics,
            omnichannel: dict.regional_network.filter_omnichannel,
          }}
        />
      </Box>

      {/* 4. Pan-European Marketplaces & Digital Scaling (Pilot Program 2026) */}
      <Box id="marketplaces">
        <MarketplacesSection
          lang={lang}
          badge={dict.marketplaces_section.badge}
          title={dict.marketplaces_section.title}
          subtitle={dict.marketplaces_section.subtitle}
          launchNotice={dict.marketplaces_section.launch_notice}
          dropdownLabel={dict.marketplaces_section.dropdown_label}
          servicesTitle={dict.marketplaces_section.services_title}
          servicesSubtitle={dict.marketplaces_section.services_subtitle}
          ctaTitle={dict.marketplaces_section.cta_title}
          ctaDesc={dict.marketplaces_section.cta_desc}
          ctaButton={dict.marketplaces_section.cta_button}
          marketplaces={dict.marketplaces_section.marketplaces}
          services={dict.marketplaces_section.services}
          intakeDict={dict.intake_modal}
        />
      </Box>

      {/* 5. Core Business Capabilities Section (Серый фон) */}
      <Box id="capabilities" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 7, maxWidth: 760, mx: "auto" }}>
            <Chip
              label="B2B Capabilities"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, mb: 1.5, borderRadius: "6px" }}
            />
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "#0f172a", mb: 2, fontSize: { xs: "2rem", md: "2.6rem" } }}>
              {dict.capabilities.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
              {dict.capabilities.subtitle}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {capabilities.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 6 }}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3.5,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#ffffff",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                      transition: "transform 0.25s, box-shadow 0.25s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2.5,
                          bgcolor: "rgba(255, 153, 0, 0.12)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2.5,
                        }}
                      >
                        <IconComp sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mb: 1.5, color: "#0f172a" }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* 5. Commercial Standards & Operational Framework (Synchronized with PDF) */}
      <Box id="standards" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#0f172a", color: "#ffffff" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 7, maxWidth: 800, mx: "auto" }}>
            <Chip
              label="Operational Framework"
              size="small"
              sx={{ bgcolor: "rgba(255, 153, 0, 0.2)", color: "#ffb74d", fontWeight: 700, mb: 1.5, borderRadius: "6px" }}
            />
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: "2rem", md: "2.6rem" } }}>
              {dict.standards.title}
            </Typography>
            <Typography variant="body1" sx={{ color: "#94a3b8", fontSize: "1.1rem" }}>
              {dict.standards.subtitle}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {standards.map((std, idx) => {
              const IconComp = std.icon;
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 6 }}>
                  <Box
                    sx={{
                      p: 4,
                      height: "100%",
                      borderRadius: 3.5,
                      bgcolor: "rgba(30, 41, 59, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: "rgba(30, 41, 59, 0.95)",
                        borderColor: std.accent,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2.5,
                        bgcolor: `${std.accent}20`,
                        color: std.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                      }}
                    >
                      <IconComp sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: "#f8fafc" }}>
                      {std.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#94a3b8", lineHeight: 1.65 }}>
                      {std.desc}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* 5. How We Work With Brands (4 Steps) */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#f8fafc" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 7, maxWidth: 760, mx: "auto" }}>
            <Chip
              label="Commercial Process"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, mb: 1.5, borderRadius: "6px" }}
            />
            <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "#0f172a", mb: 2, fontSize: { xs: "2rem", md: "2.6rem" } }}>
              {dict.how_we_work.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
              {dict.how_we_work.subtitle}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {steps.map((st, idx) => (
              <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 3.5,
                    height: "100%",
                    borderRadius: 3,
                    bgcolor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      color: "primary.main",
                      fontFamily: "monospace",
                      mb: 1.5,
                    }}
                  >
                    {st.num}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: "#0f172a", lineHeight: 1.3 }}>
                    {st.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mt: "auto" }}>
                    {st.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 6. CTA & Partner Onboarding Section */}
      <Box sx={{ bgcolor: "#ffffff", py: { xs: 8, md: 10 }, borderTop: "1px solid #e2e8f0" }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 900, color: "#0f172a", fontSize: { xs: "1.9rem", md: "2.5rem" } }}>
            {dict.cta.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: "1.15rem", lineHeight: 1.6, maxWidth: 640, mx: "auto" }}>
            {dict.cta.desc}
          </Typography>
          <PartnerCtaButtons
            partnerLabel={dict.cta.button_partner}
            pdfLabel={dict.cta.button_pdf}
            intakeDict={dict.intake_modal}
            lang={lang}
            variant="cta"
          />
        </Container>
      </Box>
    </Box>
  );
}
