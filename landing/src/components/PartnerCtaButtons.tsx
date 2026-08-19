"use client";

import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { COMPANY_DETAILS_PDF_URL } from "../config/constants";
import PartnerIntakeModal from "./PartnerIntakeModal";
import { Locale } from "../i18n/config";

interface PartnerCtaButtonsProps {
  partnerLabel: string;
  pdfLabel: string;
  intakeDict: any;
  lang: Locale;
  variant?: "hero" | "cta";
}

export default function PartnerCtaButtons({
  partnerLabel,
  pdfLabel,
  intakeDict,
  lang,
  variant = "hero",
}: PartnerCtaButtonsProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isHero = variant === "hero";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: isHero ? "flex-start" : "center",
          alignItems: "center",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<HandshakeIcon />}
          onClick={() => setModalOpen(true)}
          sx={{
            borderRadius: "30px",
            px: { xs: 3, sm: 4 },
            py: 1.5,
            fontSize: { xs: "0.95rem", sm: "1.05rem" },
            fontWeight: 700,
            boxShadow: "0 10px 25px rgba(255, 153, 0, 0.35)",
            "&:hover": {
              boxShadow: "0 14px 28px rgba(255, 153, 0, 0.45)",
            },
          }}
        >
          {partnerLabel}
        </Button>

        <Button
          component="a"
          href={`/viasglobal-company-details-${lang}.pdf`}
          download={`Viasglobal-Company-Details-${lang.toUpperCase()}.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          variant={isHero ? "outlined" : "outlined"}
          size="large"
          startIcon={<PictureAsPdfIcon />}
          sx={{
            borderRadius: "30px",
            px: { xs: 3, sm: 3.5 },
            py: 1.4,
            fontSize: { xs: "0.9rem", sm: "0.98rem" },
            fontWeight: 600,
            color: isHero ? "#ffffff" : "secondary.main",
            borderColor: isHero ? "rgba(255,255,255,0.35)" : "#cbd5e1",
            bgcolor: isHero ? "rgba(255,255,255,0.05)" : "transparent",
            "&:hover": {
              borderColor: "primary.main",
              color: "primary.main",
              bgcolor: isHero ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.02)",
            },
          }}
        >
          {pdfLabel}
        </Button>
      </Box>

      <PartnerIntakeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={intakeDict}
        lang={lang}
      />
    </>
  );
}
