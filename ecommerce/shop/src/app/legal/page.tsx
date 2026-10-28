"use client";

import { useCartStore } from "@/store/cartStore";

/**
 * Страница юридической информации (Aviso Legal - ст. 10 LSSICE) (ES / EN) в светлой теме
 */
export default function LegalPage() {
  const { language } = useCartStore();

  return (
    <div style={{ padding: "50px 0 80px" }}>
      <div className="container" style={{ maxWidth: "840px" }}>
        <h1 style={{ fontSize: "2.4rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "24px" }}>
          {language === "es" ? "Aviso Legal y Términos de Uso" : "Legal Notice & Terms of Use"}
        </h1>

        <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "24px", lineHeight: 1.7, color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {language === "es" ? "1. Datos identificativos del titular (LSSICE art. 10)" : "1. Website Owner Identification (LSSICE Art. 10)"}
            </h2>
            <p>
              {language === "es"
                ? "En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), a continuación se reflejan los siguientes datos:"
                : "In accordance with Article 10 of Spanish Law 34/2002 on Information Society Services and Electronic Commerce (LSSICE), the identifying details of the operator are as follows:"}
            </p>
            <ul style={{ listStyle: "disc", paddingLeft: "20px", marginTop: "8px" }}>
              <li><strong>{language === "es" ? "Titular comercial:" : "Commercial Owner:"}</strong> Vitalii Iasinskii</li>
              <li><strong>{language === "es" ? "Condición jurídica:" : "Legal Status:"}</strong> Trabajador Autónomo (España)</li>
              <li><strong>{language === "es" ? "NIF / Número de IVA UE:" : "NIF / EU VAT Number:"}</strong> ESZ1154366R</li>
              <li><strong>{language === "es" ? "Domicilio de actividad:" : "Business Location:"}</strong> Valencia, España (Spain)</li>
              <li><strong>{language === "es" ? "Correo electrónico:" : "Contact Email:"}</strong> info@viasglobal.es</li>
              <li><strong>{language === "es" ? "Registro VIES:" : "VIES Registry:"}</strong> Operador Intracomunitario validado por la Comisión Europea (VIES 0% VAT).</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {language === "es" ? "2. Propiedad Intelectual e Industrial" : "2. Intellectual & Industrial Property"}
            </h2>
            <p>
              {language === "es"
                ? "Todos los contenidos de este sitio web, incluyendo textos, gráficos, logotipos, iconos de botones, imágenes y software, son propiedad exclusiva de Viasglobal o de sus proveedores de contenido y están protegidos por las leyes españolas e internacionales de propiedad intelectual."
                : "All elements of this online store including text, graphics, logos, icons, and software are the property of Viasglobal or its partners and are protected by applicable intellectual property regulations."}
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {language === "es" ? "3. Legislación aplicable y Jurisdicción" : "3. Applicable Law & Jurisdiction"}
            </h2>
            <p>
              {language === "es"
                ? "Para la resolución de cualquier controversia o cuestión litigiosa relativa a este sitio web o las compras efectuadas en él, se aplicará la legislación española, siendo competentes los Juzgados y Tribunales de la ciudad de Valencia (España)."
                : "Any disputes or legal matters arising in connection with this website or transactions conducted on it shall be governed by Spanish law, under the jurisdiction of the courts of Valencia, Spain."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
