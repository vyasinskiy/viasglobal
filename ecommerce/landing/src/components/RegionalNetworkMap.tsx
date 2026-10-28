"use client";

import React, { useEffect, useRef } from "react";
import { Box, Typography, Chip, Paper, Grid } from "@mui/material";
import HubIcon from "@mui/icons-material/Hub";
import "leaflet/dist/leaflet.css";

// 25 realistic partner coordinates across the Valencian Community
const ANONYMOUS_PARTNER_COORDINATES = [
  // Headquarters
  { lat: 40.2312, lng: -0.0658, isHQ: true, label: "Viasglobal Operations Hub" },

  // Castellón Province & North
  { lat: 39.9864, lng: -0.0513 }, // Castellón de la Plana (Centro)
  { lat: 39.9765, lng: 0.0152 },  // Castellón (Grao)
  { lat: 39.9378, lng: -0.1008 }, // Vila-real
  { lat: 39.9515, lng: -0.0612 }, // Almassora
  { lat: 39.8895, lng: -0.0841 }, // Burriana
  { lat: 39.9628, lng: -0.2584 }, // Onda
  { lat: 40.0541, lng: 0.0652 },  // Benicàssim
  { lat: 39.8152, lng: -0.1874 }, // La Vall d'Uixó

  // Sagunto & Camp de Morvedre Corridor
  { lat: 39.6803, lng: -0.2789 }, // Sagunto (Centro)
  { lat: 39.6582, lng: -0.2184 }, // Port de Sagunt
  { lat: 39.6154, lng: -0.3012 }, // Puçol

  // Valencia Metropolitan Hubs
  { lat: 39.4699, lng: -0.3763 }, // Valencia Centro
  { lat: 39.4582, lng: -0.3541 }, // Valencia Ciudad de las Artes
  { lat: 39.4612, lng: -0.3315 }, // Valencia Port
  { lat: 39.5021, lng: -0.4412 }, // Paterna (Parque Tecnológico)
  { lat: 39.4912, lng: -0.4125 }, // Burjassot
  { lat: 39.4925, lng: -0.4612 }, // Manises
  { lat: 39.4325, lng: -0.4684 }, // Torrent
  { lat: 39.4412, lng: -0.4351 }, // Aldaia

  // South & Inland Valencian Hubs
  { lat: 39.2784, lng: -0.3125 }, // Cullera
  { lat: 39.2025, lng: -0.3612 }, // Sueca
  { lat: 39.1512, lng: -0.4345 }, // Alzira
  { lat: 38.9678, lng: -0.1812 }, // Gandia
  { lat: 38.9912, lng: -0.5215 }, // Xàtiva
  { lat: 38.7054, lng: -0.4745 }, // Alcoi

  // Alicante Hubs
  { lat: 38.3452, lng: -0.4815 }, // Alicante Centro
  { lat: 38.2678, lng: -0.6984 }, // Elche
];

interface RegionalNetworkMapProps {
  badge: string;
  title: string;
  subtitle: string;
  stats: {
    points_num: string;
    points_label: string;
    coverage_num: string;
    coverage_label: string;
    transit_num: string;
    transit_label: string;
  };
  filterLabels: {
    all: string;
    retail: string;
    logistics: string;
    omnichannel: string;
  };
}

export default function RegionalNetworkMap({
  badge,
  title,
  subtitle,
  stats,
}: RegionalNetworkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Center on Valencia metropolitan region
      const map = L.map(mapContainerRef.current, {
        center: [39.52, -0.38],
        zoom: 9,
        scrollWheelZoom: false, // gentle scroll
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // CartoDB Voyager Tile Layer (clean, high-contrast, modern Google Maps aesthetic)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd",
      }).addTo(map);

      // Custom pulsing marker icons
      const partnerIcon = L.divIcon({
        className: "custom-partner-marker",
        html: `
          <div style="
            position: relative;
            width: 14px;
            height: 14px;
            background-color: #FF9900;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          ">
            <div style="
              position: absolute;
              top: -4px;
              left: -4px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: rgba(255, 153, 0, 0.4);
              animation: pinPulse 2s infinite ease-out;
            "></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const hqIcon = L.divIcon({
        className: "custom-hq-marker",
        html: `
          <div style="
            position: relative;
            width: 22px;
            height: 22px;
            background-color: #0f172a;
            border: 2.5px solid #FF9900;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FF9900;
            font-size: 11px;
            font-weight: 900;
            box-shadow: 0 0 14px rgba(255, 153, 0, 0.7);
          ">
            ★
            <div style="
              position: absolute;
              top: -6px;
              left: -6px;
              width: 29px;
              height: 29px;
              border-radius: 50%;
              background: rgba(255, 153, 0, 0.4);
              animation: pinPulse 1.8s infinite ease-out;
            "></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      // Add markers
      ANONYMOUS_PARTNER_COORDINATES.forEach((point) => {
        if (point.isHQ) {
          L.marker([point.lat, point.lng], { icon: hqIcon })
            .bindTooltip("★ Viasglobal Operations Hub (Castellón)", {
              direction: "top",
              className: "vias-map-tooltip-hq",
            })
            .addTo(map);
        } else {
          L.marker([point.lat, point.lng], { icon: partnerIcon })
            .bindTooltip("✓ Partner Location / Punto de Distribución B2B", {
              direction: "top",
              className: "vias-map-tooltip",
            })
            .addTo(map);
        }
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: "#f1f5f9", color: "text.primary" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Chip
            icon={<HubIcon sx={{ fontSize: "15px !important", color: "#FF9900 !important" }} />}
            label={badge}
            sx={{
              bgcolor: "rgba(255, 153, 0, 0.12)",
              color: "#d97706",
              fontWeight: 700,
              fontSize: "0.82rem",
              border: "1px solid rgba(255, 153, 0, 0.3)",
              mb: 1.5,
            }}
          />
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
              maxWidth: 760,
              mx: "auto",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Real Interactive Map Container */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid #cbd5e1",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            position: "relative",
          }}
        >
          {/* Leaflet Map DOM Element */}
          <Box
            ref={mapContainerRef}
            sx={{
              width: "100%",
              height: { xs: 380, sm: 480, md: 540 },
              zIndex: 1,
            }}
          />

          {/* Overlay Stats Bar */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 12, sm: 20 },
              left: "50%",
              transform: "translateX(-50%)",
              width: { xs: "92%", sm: "auto" },
              maxWidth: 800,
              zIndex: 1000,
              bgcolor: "rgba(15, 23, 42, 0.88)",
              backdropFilter: "blur(10px)",
              p: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            }}
          >
            <Grid container spacing={{ xs: 1, sm: 3 }} sx={{ alignItems: "center", justifyContent: "center" }}>
              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#FF9900", lineHeight: 1.1, fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
                    {stats.points_num}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: { xs: "0.68rem", sm: "0.75rem" }, display: "block" }}>
                    {stats.points_label}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.12)", borderRight: "1px solid rgba(255,255,255,0.12)" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#38bdf8", lineHeight: 1.1, fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
                    {stats.coverage_num}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: { xs: "0.68rem", sm: "0.75rem" }, display: "block" }}>
                    {stats.coverage_label}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#34d399", lineHeight: 1.1, fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
                    {stats.transit_num}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: { xs: "0.68rem", sm: "0.75rem" }, display: "block" }}>
                    {stats.transit_label}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Global CSS for Leaflet Tooltip & Pulsing Animations */}
      <style jsx global>{`
        @keyframes pinPulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        .vias-map-tooltip {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .vias-map-tooltip-hq {
          background-color: #0f172a !important;
          color: #FF9900 !important;
          border: 1px solid #FF9900 !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.4) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
          background: #e2e8f0 !important;
        }
      `}</style>
    </Box>
  );
}
