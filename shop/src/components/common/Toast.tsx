"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

/**
 * Глобальный всплывающий тост для уведомлений
 */
export const Toast = () => {
  const { toast, hideToast } = useCartStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 20px",
        background: "rgba(17, 24, 39, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
        color: "#ffffff",
        maxWidth: "400px",
        animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {toast.type === "success" && <CheckCircle2 size={20} color="#10b981" />}
      {toast.type === "info" && <Info size={20} color="#38bdf8" />}
      {toast.type === "warning" && <AlertTriangle size={20} color="#f59e0b" />}

      <span style={{ fontSize: "0.9rem", flex: 1, fontWeight: 500 }}>
        {toast.text}
      </span>

      <button
        onClick={hideToast}
        style={{
          display: "flex",
          color: "rgba(255, 255, 255, 0.5)",
          padding: "4px",
          borderRadius: "6px",
        }}
        aria-label="Закрыть уведомление"
      >
        <X size={16} />
      </button>
    </div>
  );
};
