"use client";

import React, { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { i18n, Locale } from "../i18n/config";
import { useRouter, usePathname } from "next/navigation";

const languageNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

export default function LanguageSwitcher({ currentLang }: { currentLang: Locale }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const switchLanguage = (newLang: Locale) => {
    if (newLang === currentLang) {
      handleClose();
      return;
    }
    // Pathname looks like /es/about, /en, etc.
    if (!pathname) return;
    const segments = pathname.split("/");
    // segment 0 is empty string, segment 1 is the lang code usually
    if (segments.length >= 2 && i18n.locales.includes(segments[1] as Locale)) {
      segments[1] = newLang;
      router.push(segments.join("/") || "/");
    } else {
      router.push(`/${newLang}`);
    }
    handleClose();
  };

  return (
    <Box>
      <Button
        id="lang-button"
        aria-controls={open ? "lang-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        color="inherit"
        startIcon={<LanguageIcon />}
        sx={{ fontWeight: 600, color: "secondary.main", minWidth: 0, px: 1, mr: 1 }}
      >
        {currentLang.toUpperCase()}
      </Button>
      <Menu
        id="lang-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{ list: { "aria-labelledby": "lang-button" } }}
      >
        {i18n.locales.map((loc) => (
          <MenuItem 
            key={loc} 
            selected={loc === currentLang}
            onClick={() => switchLanguage(loc)}
          >
            {languageNames[loc]}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
