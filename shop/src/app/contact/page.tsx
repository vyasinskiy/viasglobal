"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Mail, MapPin, Send, CheckCircle2, Clock } from "lucide-react";

/**
 * Страница контактов и формы связи с поддержкой (ES / EN) в светлой теме
 */
export default function ContactPage() {
  const { language } = useCartStore();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "support",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const t = {
    badge: language === "es" ? "Atención al Cliente" : "Customer Support",
    title: language === "es" ? "Contacto y Soporte" : "Contact & Support",
    subtitle:
      language === "es"
        ? "Respondemos a todas las consultas en un plazo inferior a 24 horas laborables."
        : "We respond to all inquiries within 24 business hours.",
    emailTitle: language === "es" ? "Correo electrónico" : "Email Address",
    emailSub:
      language === "es"
        ? "Para dudas sobre pedidos, garantías, envíos o devoluciones."
        : "For questions about orders, warranty, shipping, and returns.",
    hubTitle: language === "es" ? "Almacén y Oficinas" : "Fulfillment & Office",
    hubLoc: "Valencia, España (Spain)",
    hubSub: "Vitalii Iasinskii (Autónomo) • NIF / EU VAT: ESZ1154366R",
    hoursTitle: language === "es" ? "Horario de Atención" : "Support Hours",
    hoursVal: "Lunes a Viernes: 09:00 - 18:00 CET",
    hoursSub:
      language === "es"
        ? "Expedición diaria de pedidos en días laborables."
        : "Daily dispatch on business days.",
    formTitle: language === "es" ? "Envíanos un mensaje" : "Send us a message",
    formSubtitle:
      language === "es"
        ? "Rellena el siguiente formulario y nos pondremos en contacto contigo:"
        : "Fill out the form below and our team will get back to you:",
    nameLabel: language === "es" ? "Tu nombre *" : "Your name *",
    emailLabel: language === "es" ? "Tu correo electrónico *" : "Your email *",
    subjectLabel: language === "es" ? "Motivo de la consulta" : "Topic of inquiry",
    subj1: language === "es" ? "Consulta sobre un pedido o producto" : "Question about an order or product",
    subj2: language === "es" ? "Garantía o devolución de producto" : "Warranty claim or return request",
    subj3: language === "es" ? "Venta al por mayor (B2B Wholesale)" : "B2B Wholesale inquiry",
    subj4: language === "es" ? "Otra consulta" : "Other inquiry",
    msgLabel: language === "es" ? "Mensaje *" : "Message *",
    submitBtn: language === "es" ? "Enviar mensaje" : "Send Message",
    successTitle: language === "es" ? "¡Mensaje enviado con éxito!" : "Message Sent Successfully!",
    successDesc:
      language === "es"
        ? "Hemos recibido tu consulta y te responderemos por correo electrónico lo antes posible."
        : "We have received your message and will respond via email as soon as possible.",
  };

  return (
    <div style={{ padding: "50px 0 80px" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase" }}>
            {t.badge}
          </div>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-main)", fontWeight: 800, marginTop: "6px", marginBottom: "12px" }}>
            {t.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            {t.subtitle}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
          }}
        >
          {/* Информационные карточки */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{t.emailTitle}</div>
                  <a href="mailto:info@viasglobal.es" style={{ color: "#0284c7", fontWeight: 700 }}>
                    info@viasglobal.es
                  </a>
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {t.emailSub}
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#047857" }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{t.hubTitle}</div>
                  <div style={{ color: "var(--text-main)", fontWeight: 700 }}>{t.hubLoc}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {t.hubSub}
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{t.hoursTitle}</div>
                  <div style={{ color: "var(--text-main)", fontWeight: 700 }}>{t.hoursVal}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {t.hoursSub}
              </p>
            </div>
          </div>

          {/* Форма */}
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 10px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: "1.4rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
                  {t.successTitle}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  {t.successDesc}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h2 style={{ fontSize: "1.3rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "4px" }}>
                  {t.formTitle}
                </h2>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                  {t.formSubtitle}
                </p>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>{t.nameLabel}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-main)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-main)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>{t.subjectLabel}</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-main)", outline: "none" }}
                  >
                    <option value="support">{t.subj1}</option>
                    <option value="warranty">{t.subj2}</option>
                    <option value="b2b">{t.subj3}</option>
                    <option value="other">{t.subj4}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>{t.msgLabel}</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-main)", resize: "vertical" }}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: "8px", padding: "14px", fontSize: "1rem", justifyContent: "center" }}>
                  <Send size={18} /> {t.submitBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
