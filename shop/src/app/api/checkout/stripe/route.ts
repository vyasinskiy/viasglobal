import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { Client } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Создает подключение к PostgreSQL Supabase для сохранения заказов
 */
async function getPgClient(): Promise<Client | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

/**
 * API создания сессии Stripe Checkout
 * POST /api/checkout/stripe
 */
export async function POST(req: NextRequest) {
  let pgClient: Client | null = null;
  try {
    const body = await req.json();
    const {
      items,
      customer,
      shippingMethod = "standard",
      shippingCost = 0,
      appliedCoupon,
      language = "es",
    } = body;

    // 1. Валидация входных данных
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: language === "es" ? "El carrito está vacío" : "Cart is empty" },
        { status: 400 }
      );
    }

    if (!customer || !customer.email || !customer.firstName || !customer.address) {
      return NextResponse.json(
        { error: language === "es" ? "Datos de envío incompletos" : "Incomplete customer details" },
        { status: 400 }
      );
    }

    // 2. Расчет финансовых сумм
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        discount = Math.round(((subtotal * appliedCoupon.discountValue) / 100) * 100) / 100;
      } else {
        discount = Math.min(subtotal, appliedCoupon.discountValue);
      }
    }

    const shipping = Number(shippingCost) || 0;
    const total = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100);

    // 3. Формирование уникального номера заказа
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `VG-${year}-${randomSuffix}`;
    const customerFullName = `${customer.firstName} ${customer.lastName || ""}`.trim();

    // 4. Подготовка снимка товаров для БД
    const itemsSnapshot = items.map((item: any) => ({
      id: item.product?.id,
      title: item.product?.title?.[language] || item.product?.title?.es || item.product?.title,
      price: Number(item.product?.price) || 0,
      quantity: Number(item.quantity) || 1,
      image: item.product?.mainImage,
      sku: item.product?.sku,
      brand: item.product?.brand,
    }));

    // Базовый URL для редиректов
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://viasglobal.es";

    // 5. Сохранение пред-заказа в PostgreSQL (со статусом pending)
    pgClient = await getPgClient();
    if (pgClient) {
      await pgClient.query(
        `INSERT INTO orders (
          id, status, customer_name, customer_email, customer_phone, customer_vat,
          shipping_address, shipping_method, shipping_cost, subtotal, discount, total,
          currency, items, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;`,
        [
          orderId,
          "pending",
          customerFullName,
          customer.email,
          customer.phone || null,
          customer.vatNumber || null,
          JSON.stringify({
            address: customer.address,
            city: customer.city,
            postalCode: customer.postalCode,
            country: customer.country || "ES",
            company: customer.companyName || null,
            notes: customer.notes || null,
          }),
          shippingMethod,
          shipping,
          subtotal,
          discount,
          total,
          "EUR",
          JSON.stringify(itemsSnapshot),
          JSON.stringify({
            language,
            coupon: appliedCoupon?.code || null,
            userAgent: req.headers.get("user-agent") || null,
          }),
        ]
      );
    }

    // 6. Если Stripe не сконфигурирован (нет боевых ключей) — включаем безопасный Демо-режим
    if (!isStripeConfigured) {
      console.warn("⚠️ Stripe API ключи не настроены в .env.local. Активирован безопасный демо-режим чекаута.");

      // Обновляем заказ как оплаченный в демо-режиме
      if (pgClient) {
        await pgClient.query(
          `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1;`,
          [orderId]
        );
      }

      return NextResponse.json({
        success: true,
        orderId,
        isDemo: true,
        url: `${origin}/checkout/success?orderId=${orderId}&demo=true`,
      });
    }

    // 7. Создание сессии в Stripe
    const lineItems: any[] = items.map((item: any) => {
      const title = item.product?.title?.[language] || item.product?.title?.es || "Producto";
      const imageUrl = item.product?.mainImage;

      return {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(item.product?.price) * 100),
          product_data: {
            name: title,
            images: imageUrl ? [imageUrl] : undefined,
            metadata: {
              productId: item.product?.id || "",
              sku: item.product?.sku || "",
            },
          },
        },
        quantity: Number(item.quantity) || 1,
      };
    });

    // Добавляем доставку отдельной позицией, если она платная
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          unit_amount: Math.round(shipping * 100),
          product_data: {
            name: language === "es" ? "Envío estándar a domicilio" : "Standard Home Delivery",
          },
        },
        quantity: 1,
      });
    }

    // Добавляем скидку, если есть купон
    let discountsConfig: any = undefined;
    if (discount > 0) {
      try {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(discount * 100),
          currency: "eur",
          duration: "once",
          name: appliedCoupon ? `Cupón ${appliedCoupon.code}` : "Descuento especial",
        });
        discountsConfig = [{ coupon: stripeCoupon.id }];
      } catch (couponErr) {
        console.warn("Не удалось создать купон в Stripe, продолжаем без него:", couponErr);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "link"],
      mode: "payment",
      line_items: lineItems,
      discounts: discountsConfig,
      customer_email: customer.email,
      locale: language === "es" ? "es" : "en",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${origin}/checkout?canceled=true&orderId=${orderId}`,
      metadata: {
        orderId,
        customerName: customerFullName,
        customerEmail: customer.email,
        phone: customer.phone || "",
      },
    });

    // 8. Обновляем сессию в PostgreSQL
    if (pgClient) {
      await pgClient.query(
        `UPDATE orders SET stripe_session_id = $1, updated_at = NOW() WHERE id = $2;`,
        [session.id, orderId]
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: any) {
    console.error("❌ Ошибка при создании сессии Stripe Checkout:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar el pago" },
      { status: 500 }
    );
  } finally {
    if (pgClient) {
      await pgClient.end().catch(() => {});
    }
  }
}
