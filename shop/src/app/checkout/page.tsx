"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { SHIPPING_METHODS } from "@/data/products";
import { PaymentMethod } from "@/types";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Building2,
  AlertCircle,
} from "lucide-react";

/**
 * Страница оформления заказа (Checkout) с переводами (ES / EN)
 */
export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    language,
    items,
    appliedCoupon,
    getSubtotal,
    getDiscountAmount,
    getShippingCost,
    getTotalAmount,
    clearCart,
  } = useCartStore();

  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  // Форма данных покупателя
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    vatNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ES",
    notes: "",
    acceptTerms: false,
  });

  const [selectedShipping, setSelectedShipping] = useState<string>("standard");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("card");

  const [cardDetails, setCardDetails] = useState({
    number: "4242 •••• •••• 4242",
    expiry: "12/28",
    cvc: "•••",
    name: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
        {language === "es" ? "Cargando checkout..." : "Loading checkout..."}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: "80px 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>{t.cart.emptyTitle}</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            {t.cart.emptyDesc}
          </p>
          <Link href="/products" className="btn-primary">
            {t.cart.goToCatalog}
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const baseShippingCost = getShippingCost();
  const selectedShippingObj = SHIPPING_METHODS.find((m) => m.id === selectedShipping);
  const currentShippingPrice = baseShippingCost === 0 ? 0 : (selectedShippingObj?.price || 4.99);
  const total = Math.max(0, subtotal - discount + currentShippingPrice);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const errText = {
      fn: language === "es" ? "Indique su nombre" : "Please enter your first name",
      ln: language === "es" ? "Indique sus apellidos" : "Please enter your last name",
      em: language === "es" ? "Indique un email válido" : "Please enter a valid email",
      ph: language === "es" ? "Indique su teléfono" : "Please enter your phone number",
      addr: language === "es" ? "Indique la dirección de entrega" : "Please enter your street address",
      ct: language === "es" ? "Indique la ciudad" : "Please enter your city",
      pc: language === "es" ? "Indique el código postal" : "Please enter your postal code",
      terms: language === "es" ? "Debe aceptar los términos de compra" : "You must agree to the terms",
    };

    if (!formData.firstName.trim()) errors.firstName = errText.fn;
    if (!formData.lastName.trim()) errors.lastName = errText.ln;
    if (!formData.email.trim() || !formData.email.includes("@"))
      errors.email = errText.em;
    if (!formData.phone.trim()) errors.phone = errText.ph;
    if (!formData.address.trim()) errors.address = errText.addr;
    if (!formData.city.trim()) errors.city = errText.ct;
    if (!formData.postalCode.trim()) errors.postalCode = errText.pc;
    if (!formData.acceptTerms) errors.acceptTerms = errText.terms;
    return errors;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const orderId = `VG-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderPayload = {
        orderId,
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        total: total.toFixed(2),
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        address: `${formData.address}, ${formData.city} ${formData.postalCode}, ${formData.country}`,
        shippingMethod: selectedShippingObj?.title[language] || selectedShippingObj?.title.es,
        paymentMethod: selectedPayment,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem("last_order", JSON.stringify(orderPayload));
      }

      clearCart();
      setIsSubmitting(false);
      router.push(`/checkout/success?orderId=${orderId}`);
    }, 1200);
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Возврат в корзину */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/cart"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#38bdf8",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> {t.checkout.backToCart}
          </Link>
        </div>

        <h1 style={{ fontSize: "2.2rem", marginBottom: "32px" }}>{t.checkout.title}</h1>

        <form onSubmit={handleSubmitOrder}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "36px",
              alignItems: "start",
            }}
          >
            {/* Левая колонка: Данные и доставка */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Блок 1: Контакты */}
              <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
                <h2 style={{ fontSize: "1.2rem", color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#0284c7", color: "#fff", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>1</span>
                  {t.checkout.step1Title}
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.firstName}</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: formErrors.firstName ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                      }}
                    />
                    {formErrors.firstName && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.firstName}</span>}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.lastName}</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: formErrors.lastName ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                      }}
                    />
                    {formErrors.lastName && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.lastName}</span>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.email}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: formErrors.email ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                      }}
                    />
                    {formErrors.email && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.email}</span>}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.phone}</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+34 600 000 000"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: formErrors.phone ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                      }}
                    />
                    {formErrors.phone && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.phone}</span>}
                  </div>
                </div>

                {/* B2B поля */}
                <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#38bdf8", marginBottom: "8px", fontWeight: 600 }}>
                    <Building2 size={14} /> {t.checkout.b2bTitle}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <input
                      type="text"
                      name="companyName"
                      placeholder={t.checkout.companyName}
                      value={formData.companyName}
                      onChange={handleInputChange}
                      style={{ padding: "8px 12px", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "#fff" }}
                    />
                    <input
                      type="text"
                      name="vatNumber"
                      placeholder={t.checkout.vatNumber}
                      value={formData.vatNumber}
                      onChange={handleInputChange}
                      style={{ padding: "8px 12px", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "#fff" }}
                    />
                  </div>
                </div>
              </div>

              {/* Блок 2: Адрес доставки */}
              <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
                <h2 style={{ fontSize: "1.2rem", color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#0284c7", color: "#fff", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>2</span>
                  {t.checkout.step2Title}
                </h2>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.country}</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      color: "#fff",
                      outline: "none",
                    }}
                  >
                    <option value="ES">España (Península e Islas)</option>
                    <option value="DE">Deutschland (Germany)</option>
                    <option value="FR">France</option>
                    <option value="IT">Italia</option>
                    <option value="PT">Portugal</option>
                    <option value="EU">Other European Union Country</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.address}</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Calle Mayor 12, Piso 3, Puerta B"
                    value={formData.address}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: formErrors.address ? "1px solid #ef4444" : "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      color: "#fff",
                    }}
                  />
                  {formErrors.address && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.address}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.city}</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Valencia / Madrid / Berlin"
                      value={formData.city}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: formErrors.city ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                      }}
                    />
                    {formErrors.city && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.city}</span>}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>{t.checkout.postalCode}</label>
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="46001"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: formErrors.postalCode ? "1px solid #ef4444" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                      }}
                    />
                    {formErrors.postalCode && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{formErrors.postalCode}</span>}
                  </div>
                </div>
              </div>

              {/* Блок 3: Способ доставки */}
              <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
                <h2 style={{ fontSize: "1.2rem", color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#0284c7", color: "#fff", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>3</span>
                  {t.checkout.step3Title}
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {SHIPPING_METHODS.map((method) => {
                    const isSelected = selectedShipping === method.id;
                    const price = baseShippingCost === 0 ? 0 : method.price;
                    const title = method.title[language] || method.title.es;
                    const desc = method.description[language] || method.description.es;
                    const days = method.estimatedDays[language] || method.estimatedDays.es;

                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedShipping(method.id)}
                        style={{
                          padding: "16px",
                          borderRadius: "var(--radius-sm)",
                          background: isSelected ? "rgba(2, 132, 199, 0.12)" : "rgba(255, 255, 255, 0.03)",
                          border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Truck size={20} color={isSelected ? "#38bdf8" : "var(--text-muted)"} />
                          <div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                              {title}
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {days} • {desc}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: "1rem", fontWeight: 800, color: price === 0 ? "#34d399" : "#38bdf8" }}>
                          {price === 0 ? (language === "es" ? "Gratis" : "Free") : `€${price.toFixed(2)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Блок 4: Способ оплаты */}
              <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
                <h2 style={{ fontSize: "1.2rem", color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#0284c7", color: "#fff", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>4</span>
                  {t.checkout.step4Title}
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { id: "card", label: language === "es" ? "Tarjeta bancaria" : "Credit Card", sub: "Visa / MC / Amex" },
                    { id: "apple_pay", label: "Apple / Google Pay", sub: language === "es" ? "En 1 toque" : "Fast 1-touch" },
                    { id: "paypal", label: "PayPal", sub: language === "es" ? "Protección total" : "Buyer Protection" },
                    { id: "klarna", label: "Klarna", sub: language === "es" ? "Paga en 3 plazos" : "Pay in 3 parts" },
                  ].map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay.id as PaymentMethod)}
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-sm)",
                        background: selectedPayment === pay.id ? "rgba(2, 132, 199, 0.15)" : "rgba(255, 255, 255, 0.03)",
                        border: selectedPayment === pay.id ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{pay.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "2px" }}>{pay.sub}</div>
                    </div>
                  ))}
                </div>

                {selectedPayment === "card" && (
                  <div style={{ padding: "16px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t.checkout.cardNumber}</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                        />
                        <CreditCard size={18} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t.checkout.cardExpiry}</label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>{t.checkout.cardCvc}</label>
                        <input
                          type="text"
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#fff" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Правая колонка: Состав заказа и подтверждение */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="glass-panel glass-glow" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
                <h2 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "16px" }}>
                  {t.checkout.orderSummaryTitle} ({items.reduce((s, i) => s + i.quantity, 0)} {t.checkout.itemsCount})
                </h2>

                {/* Список товаров */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {items.map((item) => {
                    const productTitle = item.product.title[language] || item.product.title.es;
                    return (
                      <div key={item.product.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ position: "relative", width: "48px", height: "48px", borderRadius: "6px", overflow: "hidden", background: "#1e293b", flexShrink: 0 }}>
                            <Image src={item.product.mainImage} alt={productTitle} fill sizes="48px" style={{ objectFit: "cover" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
                              {productTitle}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              {item.quantity} ud x €{item.product.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#38bdf8" }}>
                          €{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Суммы */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "14px", fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>{t.cart.subtotal}</span>
                    <span style={{ color: "#fff" }}>€{subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                      <span>{t.cart.discount} ({appliedCoupon?.code}):</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>{t.cart.shipping}</span>
                    <span style={{ color: currentShippingPrice === 0 ? "#34d399" : "#fff" }}>
                      {currentShippingPrice === 0 ? (language === "es" ? "Gratis" : "Free") : `€${currentShippingPrice.toFixed(2)}`}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-subtle)", fontSize: "0.8rem" }}>
                    <span>{t.cart.taxIncluded}</span>
                    <span>€{((subtotal - discount) * 0.21 / 1.21).toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#fff",
                      fontSize: "1.35rem",
                      fontWeight: 800,
                      marginTop: "8px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-color)",
                    }}
                  >
                    <span>{t.cart.total}</span>
                    <span style={{ color: "#38bdf8" }}>€{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Чекбокс согласия */}
                <div style={{ marginTop: "20px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.82rem", color: "var(--text-muted)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      style={{ marginTop: "3px", accentColor: "#0284c7" }}
                    />
                    <span>
                      {t.checkout.termsAgreement}{" "}
                      <Link href="/legal" style={{ color: "#38bdf8", textDecoration: "underline" }}>{t.checkout.termsLink}</Link>{" "}
                      {language === "es" ? "y la" : "and"}{" "}
                      <Link href="/privacy" style={{ color: "#38bdf8", textDecoration: "underline" }}>{t.checkout.privacyLink}</Link>.
                    </span>
                  </label>
                  {formErrors.acceptTerms && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#ef4444", marginTop: "4px" }}>
                      <AlertCircle size={14} /> {formErrors.acceptTerms}
                    </div>
                  )}
                </div>

                {/* Кнопка оплаты */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "1.05rem",
                    justifyContent: "center",
                    marginTop: "20px",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    t.checkout.processing
                  ) : (
                    <>
                      <Lock size={18} /> {t.checkout.payBtn} €{total.toFixed(2)}
                    </>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-subtle)", marginTop: "14px" }}>
                  <ShieldCheck size={14} color="#34d399" /> {t.checkout.sslSecure}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
