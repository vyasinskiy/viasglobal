"use client";

import { useCartStore } from "@/store/cartStore";

/**
 * Страница политики конфиденциальности и защиты данных (RGPD / LOPDGDD) (ES / EN) в светлой теме
 */
export default function PrivacyPage() {
  const { language } = useCartStore();

  return (
    <div style={{ padding: "50px 0 80px" }}>
      <div className="container" style={{ maxWidth: "840px" }}>
        <h1 style={{ fontSize: "2.4rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "24px" }}>
          {language === "es" ? "Política de Privacidad (RGPD)" : "Privacy Policy (GDPR)"}
        </h1>

        <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "24px", lineHeight: 1.7, color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {language === "es" ? "1. Responsable del tratamiento de datos" : "1. Data Controller Information"}
            </h2>
            <p>
              {language === "es"
                ? "El responsable del tratamiento de los datos recabados en este sitio web es Vitalii Iasinskii (Autónomo, NIF: ESZ1154366R, Valencia, España). Para cualquier consulta o ejercicio de derechos en materia de privacidad, puede contactar en: info@viasglobal.es."
                : "The data controller for personal data collected on this website is Vitalii Iasinskii (Autónomo, NIF: ESZ1154366R, Valencia, Spain). For any inquiries regarding personal data protection, contact: info@viasglobal.es."}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {language === "es" ? "2. Finalidad y legitimación del tratamiento" : "2. Purposes & Legal Basis of Processing"}
            </h2>
            <p>
              {language === "es"
                ? "Los datos personales se tratan con las siguientes finalidades y bases legales:"
                : "Personal data is processed strictly for the following purposes and legal bases:"}
            </p>
            <ul style={{ listStyle: "disc", paddingLeft: "20px", marginTop: "8px" }}>
              <li>
                <strong>{language === "es" ? "Gestión de pedidos y envíos:" : "Order Management & Fulfillment:"}</strong>{" "}
                {language === "es"
                  ? "Ejecución del contrato de compraventa y entrega de mercancía (art. 6.1.b RGPD)."
                  : "Execution of the sales contract and delivery of ordered goods (Art. 6.1.b GDPR)."}
              </li>
              <li>
                <strong>{language === "es" ? "Obligaciones fiscales y contables:" : "Legal & Tax Compliance:"}</strong>{" "}
                {language === "es"
                  ? "Cumplimiento de la normativa tributaria y mercantil española (art. 6.1.c RGPD)."
                  : "Compliance with applicable Spanish tax and mercantile accounting laws (Art. 6.1.c GDPR)."}
              </li>
              <li>
                <strong>{language === "es" ? "Atención al cliente y soporte postventa:" : "Customer Support:"}</strong>{" "}
                {language === "es"
                  ? "Resolución de incidencias y gestión de garantías (interés legítimo)."
                  : "Handling warranty inquiries and customer requests (legitimate interest)."}
              </li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {language === "es" ? "3. Derechos del usuario (ARCO-POL)" : "3. Your Data Rights (ARCO-POL)"}
            </h2>
            <p>
              {language === "es"
                ? "Usted tiene derecho a solicitar el acceso, rectificación, supresión (derecho al olvido), limitación del tratamiento, portabilidad y oposición, enviando un correo electrónico a info@viasglobal.es. Asimismo, le asiste el derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD — aepd.es)."
                : "You have the right to access, rectify, delete (right to be forgotten), restrict, or object to the processing of your personal data by emailing info@viasglobal.es. You also have the right to lodge a complaint with the Spanish Data Protection Agency (AEPD — aepd.es)."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
