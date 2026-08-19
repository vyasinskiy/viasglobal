"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";
import { COMPANY_EMAIL } from "../config/constants";
import { Locale } from "../i18n/config";
import TurnstileWidget from "./TurnstileWidget";

interface PartnerIntakeModalProps {
  open: boolean;
  onClose: () => void;
  dict: any;
  lang: Locale;
}

export default function PartnerIntakeModal({ open, onClose, dict, lang }: PartnerIntakeModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    category: "",
    orderVolume: "",
    mapPolicy: "yes",
    message: "",
  });

  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleVerifyTurnstile = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleExpireTurnstile = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const categories = [
    "Home & Kitchen",
    "Sports & Outdoor",
    "Consumer Electronics",
    "Personal Care & Beauty",
    "DIY & Home Improvement",
    "Office & Daily Goods",
    "Other Commercial Goods",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.companyName || !formData.email) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!privacyAccepted) {
      setErrorMsg("You must accept the Privacy Policy before submitting.");
      return;
    }
    if (!turnstileToken) {
      setErrorMsg("Please complete the anti-spam security verification.");
      return;
    }

    setErrorMsg("");

    // Формируем структурированное почтовое сообщение
    const subject = encodeURIComponent(`B2B Partnership Inquiry — ${formData.companyName}`);
    const body = encodeURIComponent(
      `Contact Name: ${formData.fullName}\n` +
      `Company / Brand: ${formData.companyName}\n` +
      `Email: ${formData.email}\n` +
      `Phone: ${formData.phone || "N/A"}\n` +
      `Product Category: ${formData.category || "N/A"}\n` +
      `Estimated Scope / MOV: ${formData.orderVolume || "N/A"}\n` +
      `MAP/RRP Policy: ${formData.mapPolicy}\n\n` +
      `Message & Catalog:\n${formData.message}\n\n` +
      `Security Verification: Cloudflare Turnstile Passed\n`
    );

    // Инициируем отправку через почтовый клиент
    window.open(`mailto:${COMPANY_EMAIL}?subject=${subject}&body=${body}`, "_blank");
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setErrorMsg("");
    setPrivacyAccepted(false);
    setTurnstileToken(null);
    setFormData({
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      category: "",
      orderVolume: "",
      mapPolicy: "yes",
      message: "",
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleReset}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: { xs: 1, sm: 2 },
            bgcolor: "#ffffff",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 800, color: "secondary.main" }}>
          {dict.title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleReset}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pt: 0 }}>
        {submitted ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 70, color: "#10b981", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "secondary.main" }}>
              {dict.success_title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 450, mx: "auto" }}>
              {dict.success_desc}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReset}
              sx={{ borderRadius: "20px", px: 4 }}
            >
              {dict.close_button}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {dict.subtitle}
            </Typography>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  label={dict.full_name}
                  name="fullName"
                  placeholder={dict.full_name_placeholder}
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <TextField
                  required
                  fullWidth
                  size="small"
                  label={dict.company_name}
                  name="companyName"
                  placeholder={dict.company_name_placeholder}
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <TextField
                  required
                  type="email"
                  fullWidth
                  size="small"
                  label={dict.email}
                  name="email"
                  placeholder={dict.email_placeholder}
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={dict.phone}
                  name="phone"
                  placeholder={dict.phone_placeholder}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={dict.category_label}
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>{dict.category_placeholder}</em>
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label={dict.order_volume_label}
                  name="orderVolume"
                  placeholder={dict.order_volume_placeholder}
                  value={formData.orderVolume}
                  onChange={handleChange}
                />
              </Box>

              <TextField
                select
                fullWidth
                size="small"
                label={dict.map_policy_label}
                name="mapPolicy"
                value={formData.mapPolicy}
                onChange={handleChange}
              >
                <MenuItem value="yes">{dict.map_policy_yes}</MenuItem>
                <MenuItem value="no">{dict.map_policy_no}</MenuItem>
                <MenuItem value="na">{dict.map_policy_na}</MenuItem>
              </TextField>

              <TextField
                multiline
                rows={3}
                fullWidth
                size="small"
                label={dict.message_label}
                name="message"
                placeholder={dict.message_placeholder}
                value={formData.message}
                onChange={handleChange}
              />

              {/* GDPR Explicit Consent Checkbox (unchecked by default) */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    color="primary"
                    size="small"
                    sx={{ p: 0.5, mr: 0.8, alignSelf: "center" }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.83rem", lineHeight: 1.4, m: 0 }}>
                    {dict.gdpr_agreement}{" "}
                    <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                      <MuiLink
                        component={Link}
                        href={`/${lang}/politica-privacidad`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "primary.main", fontWeight: 600, textDecoration: "underline" }}
                      >
                        {dict.privacy_link_text}
                      </MuiLink>
                      <Box component="span" sx={{ color: "primary.main", fontWeight: 700, ml: 0.3 }}>*</Box>
                    </Box>
                  </Typography>
                }
                sx={{
                  alignItems: "center",
                  m: 0,
                  mt: 0.5,
                  "& .MuiFormControlLabel-asterisk": { display: "none" },
                }}
              />

              {/* Cloudflare Turnstile Anti-Spam Widget (GDPR-compliant) */}
              <TurnstileWidget
                onVerify={handleVerifyTurnstile}
                onExpire={handleExpireTurnstile}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={!privacyAccepted || !turnstileToken}
                sx={{
                  borderRadius: "24px",
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                {dict.submit_button}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
