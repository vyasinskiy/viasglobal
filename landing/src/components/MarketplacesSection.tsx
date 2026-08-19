"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StorefrontIcon from "@mui/icons-material/Storefront";
import GppGoodIcon from "@mui/icons-material/GppGood";
import TranslateIcon from "@mui/icons-material/Translate";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PartnerIntakeModal from "./PartnerIntakeModal";

interface MarketplaceItem {
  id: string;
  name: string;
  badge: string;
  countries: string;
  categories: string;
  features: string[];
}

interface MarketplacesSectionProps {
  lang: string;
  badge: string;
  title: string;
  subtitle: string;
  launchNotice: string;
  dropdownLabel: string;
  servicesTitle: string;
  servicesSubtitle: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
  marketplaces: MarketplaceItem[];
  services: {
    title: string;
    desc: string;
  }[];
  intakeDict: any;
}

export default function MarketplacesSection({
  lang,
  badge,
  title,
  subtitle,
  launchNotice,
  dropdownLabel,
  servicesTitle,
  servicesSubtitle,
  ctaTitle,
  ctaDesc,
  ctaButton,
  marketplaces,
  services,
  intakeDict,
}: MarketplacesSectionProps) {
  const [selectedMpId, setSelectedMpId] = useState<string>(marketplaces[0]?.id || "amazon");
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const selectedMp = marketplaces.find((m) => m.id === selectedMpId) || marketplaces[0];

  const serviceIcons = [
    StorefrontIcon,
    TranslateIcon,
    GppGoodIcon,
    LocalShippingIcon,
    MonetizationOnIcon,
  ];

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "#ffffff", color: "text.primary" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Chip
              icon={<RocketLaunchIcon sx={{ fontSize: "15px !important", color: "#FF9900 !important" }} />}
              label={badge}
              sx={{
                bgcolor: "rgba(255, 153, 0, 0.12)",
                color: "#d97706",
                fontWeight: 700,
                fontSize: "0.82rem",
                border: "1px solid rgba(255, 153, 0, 0.3)",
              }}
            />
            <Chip
              label={launchNotice}
              color="warning"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.75rem", borderRadius: "16px" }}
            />
          </Box>

          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.8rem", sm: "2.4rem", md: "2.8rem" },
              color: "#0f172a",
              mb: 1.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 780,
              mx: "auto",
              fontSize: { xs: "0.95rem", md: "1.08rem" },
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Top Interactive Area: Marketplace Selector & Detailed Channel Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            bgcolor: "#f8fafc",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            mb: 7,
          }}
        >
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            {/* Left Column: Dropdown & Explanation */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, letterSpacing: 1, display: "block", mb: 1 }}>
                Digital Sales Channels
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 2 }}>
                {dropdownLabel}
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="mp-select-label" sx={{ bgcolor: "#f8fafc", px: 0.5, fontWeight: 600 }}>
                  Select Platform
                </InputLabel>
                <Select
                  labelId="mp-select-label"
                  value={selectedMpId}
                  onChange={(e) => setSelectedMpId(e.target.value)}
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: "#ffffff",
                    fontWeight: 700,
                    color: "#0f172a",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#cbd5e1",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  {marketplaces.map((mp) => (
                    <MenuItem key={mp.id} value={mp.id} sx={{ fontWeight: 600, py: 1.2 }}>
                      {mp.name} — <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>{mp.badge}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 3 }}>
                As an authorized European distribution partner, Viasglobal opens and operates dedicated marketplace storefronts for European brand manufacturers, enforcing strict MAP price policies and protecting brand equity.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={() => setModalOpen(true)}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  borderRadius: 2.5,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(255, 153, 0, 0.25)",
                }}
              >
                {ctaButton}
              </Button>
            </Grid>

            {/* Right Column: Selected Marketplace Focus Card */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                sx={{
                  borderRadius: 3.5,
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                  p: { xs: 2.5, sm: 3.5 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                    {selectedMp.name}
                  </Typography>
                  <Chip
                    label={selectedMp.badge}
                    sx={{
                      bgcolor: "rgba(255, 153, 0, 0.12)",
                      color: "#d97706",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "#475569" }}>
                  <PublicIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Target Territories: {selectedMp.countries}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: "#f1f5f9", p: 2, borderRadius: 2, mb: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.5 }}>
                    Primary Category Alignment
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    {selectedMp.categories}
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 1 }}>
                  Operational & Compliance Scope
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {selectedMp.features.map((feat, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <CheckCircleIcon sx={{ color: "#10b981", fontSize: 18, mt: 0.2 }} />
                      <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500 }}>
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Managed Services Grid */}
        <Box sx={{ mb: 7 }}>
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Typography variant="h4" component="h3" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
              {servicesTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: "auto" }}>
              {servicesSubtitle}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {services.map((srv, idx) => {
              const IconComp = serviceIcons[idx % serviceIcons.length];
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#f8fafc",
                      transition: "all 0.25s",
                      "&:hover": {
                        bgcolor: "#ffffff",
                        borderColor: "primary.main",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: "rgba(255, 153, 0, 0.12)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <IconComp sx={{ fontSize: 26 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#0f172a" }}>
                        {srv.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {srv.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Pilot Partner Invitation Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            borderRadius: 4,
            bgcolor: "#0f172a",
            color: "#ffffff",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 3,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}
        >
          <Box sx={{ maxWidth: 720 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Chip
                label="Pilot Program Q2 2026"
                size="small"
                sx={{
                  bgcolor: "rgba(255, 153, 0, 0.2)",
                  color: "#FF9900",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(255, 153, 0, 0.4)",
                }}
              />
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                Limited Brand Intake
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#ffffff", mb: 1 }}>
              {ctaTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              {ctaDesc}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setModalOpen(true)}
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontWeight: 700,
              px: 3.5,
              py: 1.4,
              borderRadius: 2.5,
              textTransform: "none",
              whiteSpace: "nowrap",
              fontSize: "0.95rem",
              boxShadow: "0 6px 20px rgba(255, 153, 0, 0.35)",
            }}
          >
            {ctaButton}
          </Button>
        </Paper>
      </Box>

      {/* Intake Modal Integration */}
      <PartnerIntakeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={intakeDict}
        lang={lang as any}
      />
    </Box>
  );
}
