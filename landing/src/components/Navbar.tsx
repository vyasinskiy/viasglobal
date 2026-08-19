"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import HandshakeIcon from "@mui/icons-material/Handshake";
import Link from "next/link";
import { COMPANY_NAME, COMPANY_DETAILS_PDF_URL } from "../config/constants";
import LanguageSwitcher from "./LanguageSwitcher";
import PartnerIntakeModal from "./PartnerIntakeModal";
import { Locale } from "../i18n/config";

export default function Navbar({ dict, intakeDict, lang }: { dict: any; intakeDict: any; lang: Locale }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const navLinks = [
    { label: dict.capabilities, href: `/${lang}#capabilities` },
    { label: dict.categories, href: `/${lang}#categories` },
    { label: dict.standards, href: `/${lang}#standards` },
    { label: dict.how_we_work, href: `/${lang}#how-it-works` },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        sx={{
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          bgcolor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between", py: 0.5 }}>
            {/* Logo */}
            <Box component={Link} href={`/${lang}`} sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <Box
                component="img"
                src="/logo.svg"
                alt={`${COMPANY_NAME} Logo`}
                sx={{ height: 38, width: "auto" }}
              />
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 3 }}>
              {navLinks.map((link) => (
                <Box
                  key={link.href}
                  component={Link}
                  href={link.href}
                  sx={{
                    color: "text.primary",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    transition: "color 0.2s",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.label}
                </Box>
              ))}
            </Box>

            {/* Actions: PDF Download + Language Switcher + Become Partner CTA */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* PDF Download link */}
              <Button
                component="a"
                href={`/viasglobal-company-details-${lang}.pdf`}
                download={`Viasglobal-Company-Details-${lang.toUpperCase()}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
                sx={{
                  display: { xs: "none", lg: "inline-flex" },
                  borderRadius: "20px",
                  textTransform: "none",
                  borderColor: "#cbd5e1",
                  color: "text.secondary",
                  fontSize: "0.82rem",
                  "&:hover": { borderColor: "primary.main", color: "primary.main" },
                }}
              >
                {dict.download_pdf}
              </Button>

              <LanguageSwitcher currentLang={lang} />

              <Button
                variant="contained"
                color="primary"
                startIcon={<HandshakeIcon sx={{ fontSize: 18 }} />}
                onClick={() => setModalOpen(true)}
                sx={{
                  borderRadius: "20px",
                  px: 2.5,
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  display: { xs: "none", sm: "inline-flex" },
                  boxShadow: "0 4px 12px rgba(255, 153, 0, 0.25)",
                }}
              >
                {dict.become_partner}
              </Button>

              {/* Mobile Menu Icon */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { md: "none" }, ml: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        slotProps={{
          paper: { sx: { width: 280, p: 2 } },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, p: 1 }}>
          <Box
            component="img"
            src="/logo.svg"
            alt={`${COMPANY_NAME} Logo`}
            sx={{ height: 32, width: "auto" }}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton
                component={Link}
                href={link.href}
                onClick={handleDrawerToggle}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {link.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            component="a"
            href={`/viasglobal-company-details-${lang}.pdf`}
            download={`Viasglobal-Company-Details-${lang.toUpperCase()}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfIcon />}
            sx={{ borderRadius: "20px", textTransform: "none" }}
          >
            {dict.download_pdf}
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<HandshakeIcon />}
            onClick={() => {
              handleDrawerToggle();
              setModalOpen(true);
            }}
            sx={{ borderRadius: "20px", fontWeight: 700 }}
          >
            {dict.become_partner}
          </Button>
        </Box>
      </Drawer>

      {/* B2B Intake Modal */}
      <PartnerIntakeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={intakeDict}
        lang={lang}
      />
    </>
  );
}
