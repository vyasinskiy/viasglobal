"use client";

import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { TURNSTILE_SITE_KEY } from "../config/constants";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  siteKey?: string;
}

export default function TurnstileWidget({
  onVerify,
  onExpire,
  siteKey = TURNSTILE_SITE_KEY,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Стабильные ссылки на колбэки, чтобы избежать повторной инициализации при ререндере формы
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted && onVerifyRef.current) {
              onVerifyRef.current(token);
            }
          },
          "expired-callback": () => {
            if (isMounted && onExpireRef.current) {
              onExpireRef.current();
            }
          },
          theme: "light",
          size: "normal",
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Turnstile render error:", err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById("cf-turnstile-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", renderWidget);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <Box
      ref={containerRef}
      sx={{
        my: 1,
        minHeight: 65,
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    />
  );
}
