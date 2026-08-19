"use client";

import React from "react";
import { Box, Chip, Tooltip, Typography, Link as MuiLink } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { VIES_VALIDATION_URL } from "../config/constants";

interface ViesBadgeProps {
  label: string;
  tooltipText: string;
  verifyText: string;
}

export default function ViesBadge({ label, tooltipText, verifyText }: ViesBadgeProps) {
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1, maxWidth: 280 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
            <VerifiedIcon sx={{ fontSize: 16, color: "#34d399" }} />
            {label}
          </Typography>
          
          <Typography variant="caption" sx={{ display: "block", color: "#cbd5e1", mb: 1.5, lineHeight: 1.4 }}>
            {tooltipText}
          </Typography>

          <Box sx={{ bgcolor: "rgba(0,0,0,0.3)", p: 1, borderRadius: 1, mb: 1.5, border: "1px solid rgba(255,255,255,0.1)" }}>
            <Typography variant="caption" sx={{ display: "block", color: "#94a3b8", fontSize: "0.7rem", mb: 0.3 }}>
              VIES Registry Parameters:
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: "#f8fafc", fontWeight: 600 }}>
              • Country: <strong>Spain (ES)</strong>
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: "#f8fafc", fontWeight: 600 }}>
              • VAT Number: <strong>Z1154366R</strong>
            </Typography>
          </Box>

          <MuiLink
            href={VIES_VALIDATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#93c5fd",
              fontSize: "0.78rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "underline",
              "&:hover": { color: "#bfdbfe" },
            }}
          >
            {verifyText}
            <OpenInNewIcon sx={{ fontSize: 13 }} />
          </MuiLink>
        </Box>
      }
      arrow
      placement="bottom"
    >
      <Chip
        icon={<VerifiedIcon sx={{ fontSize: "16px !important", color: "#10b981 !important" }} />}
        label={label}
        component="a"
        href={VIES_VALIDATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        clickable
        sx={{
          bgcolor: "rgba(16, 185, 129, 0.12)",
          color: "#059669",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            bgcolor: "rgba(16, 185, 129, 0.22)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
          },
        }}
      />
    </Tooltip>
  );
}
