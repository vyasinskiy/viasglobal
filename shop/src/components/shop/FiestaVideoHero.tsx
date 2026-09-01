"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { getCurrentWeekEvent } from "@/data/annual52WeeksCalendar";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
} from "lucide-react";

/**
 * Первый экран сайта (Hero Screen) — Видео с испанскими фиестами (Las Fallas, San Juan, Fiestas Mediterráneas)
 * с кинематографичным оверлеем, переключателями звука/паузы и призывом к подборке недели.
 */
export const FiestaVideoHero = () => {
  const { language } = useCartStore();
  const currentWeek = getCurrentWeekEvent();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Видео-источники (Фейерверки, ночные огни фиест, фестивальная атмосфера Валенсии и Средиземноморья)
  const videoUrl =
    "https://assets.mixkit.co/videos/preview/mixkit-fireworks-illuminating-the-beach-sky-41484-large.mp4";
  const posterUrl =
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1920&auto=format&fit=crop&q=80";

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const t = {
    badge:
      language === "es"
        ? "Vive la Fiesta y el Confort • España y la UE"
        : "Experience the Fiesta & Tech • Spain & EU",
    titleMain:
      language === "es"
        ? "Tecnología para Cada Fiesta y Momento Único"
        : "Smart Tech for Every Fiesta & Special Moment",
    titleHighlight: language === "es" ? "En España" : "In Spain",
    subtitle:
      language === "es"
        ? "Sonido Hi-Res, iluminación inteligente y accesorios ergonómicos preparados para cada puente, festival y celebración. Envío urgente 24/48h desde Castellón y Valencia."
        : "Hi-Res audio, smart lighting, and ergonomic gear tailored for every Spanish fiesta, holiday bridge, and festival. 24/48h express delivery from Castellón & Valencia.",
    exploreEventBtn:
      language === "es"
        ? `Ver Colección: ${currentWeek.title.es}`
        : `Explore Collection: ${currentWeek.title.en}`,
    calendarBtn:
      language === "es" ? "Calendario 52 Semanas" : "52-Week Calendar",
    dispatchBadge:
      language === "es"
        ? "Envío urgente en 24h desde Castellón / Valencia"
        : "24h express dispatch from Castellón / Valencia",
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#0b0f19",
        marginBottom: "48px",
      }}
    >
      {/* Фоновое видео */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        poster={posterUrl}
        onLoadedData={() => setVideoLoaded(true)}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          minWidth: "100%",
          minHeight: "100%",
          width: "auto",
          height: "auto",
          transform: "translate(-50%, -50%)",
          objectFit: "cover",
          zIndex: 1,
          filter: "brightness(0.55) contrast(1.1)",
        }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Градиентный оверлей для глубокого контраста и читаемости */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(11, 15, 25, 0.4) 0%, rgba(11, 15, 25, 0.75) 70%, rgba(11, 15, 25, 1) 100%)",
          zIndex: 2,
        }}
      />

      {/* Радиальный акцентный свет */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "20%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, transparent 70%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Контент первого экрана */}
      <div className="container" style={{ position: "relative", zIndex: 10, padding: "80px 20px" }}>
        <div style={{ maxWidth: "800px" }}>
          {/* Бейдж события */}
          <div
            className="animate-fade-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "rgba(2, 132, 199, 0.25)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              backdropFilter: "blur(12px)",
              color: "#38bdf8",
              fontSize: "0.85rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "20px",
              boxShadow: "0 0 25px rgba(2, 132, 199, 0.3)",
            }}
          >
            <Sparkles size={16} />
            <span>{t.badge}</span>
          </div>

          {/* Главный заголовок */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              marginBottom: "20px",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            {t.titleMain}{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #fbbf24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t.titleHighlight}
            </span>
          </h1>

          {/* Подзаголовок */}
          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "#e2e8f0",
              lineHeight: 1.6,
              marginBottom: "32px",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.7)",
              maxWidth: "680px",
            }}
          >
            {t.subtitle}
          </p>

          {/* Кнопки действий */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginBottom: "28px" }}>
            <Link
              href={currentWeek.targetUrl}
              className="btn-primary"
              style={{
                padding: "16px 32px",
                fontSize: "1.05rem",
                boxShadow: "0 0 30px rgba(2, 132, 199, 0.5)",
              }}
            >
              <Zap size={18} /> {t.exploreEventBtn} <ArrowRight size={18} />
            </Link>

            <a
              href="#calendario-fiestas"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px 28px",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#34d399",
                background: "rgba(16, 185, 129, 0.18)",
                border: "1px solid rgba(16, 185, 129, 0.45)",
                borderRadius: "var(--radius-sm)",
                backdropFilter: "blur(12px)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById("calendario-fiestas");
                if (target) {
                  const headerOffset = 110;
                  const elementPosition = target.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.28)";
                e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.7)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(16, 185, 129, 0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.18)";
                e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.45)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Calendar size={18} /> {t.calendarBtn}
            </a>
          </div>
        </div>
      </div>

      {/* Кнопки управления видео в нижнем углу */}
      <div
        style={{
          position: "absolute",
          right: "24px",
          bottom: "24px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
          padding: "6px 12px",
          borderRadius: "var(--radius-full)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
          title={isPlaying ? "Pausar vídeo" : "Reproducir vídeo"}
          aria-label={isPlaying ? "Pausar vídeo" : "Reproducir vídeo"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={toggleMute}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
          title={isMuted ? "Activar sonido" : "Silenciar"}
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>
          Fiestas de España HD
        </span>
      </div>
    </div>
  );
};
