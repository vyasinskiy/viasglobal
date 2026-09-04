import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { Client } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Проверка статуса оплаты Stripe и получение подтвержденных данных заказа
 * GET /api/checkout/stripe/verify?session_id=...&orderId=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("orderId");

  if (!sessionId && !orderId) {
    return NextResponse.json({ error: "Missing session_id or orderId" }, { status: 400 });
  }

  const dbUrl = process.env.DATABASE_URL;
  let pgClient: Client | null = null;

  try {
    let stripeSession: any = null;

    // 1. Если передан sessionId и настроен Stripe, получаем сессию из Stripe API
    if (sessionId && isStripeConfigured) {
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (stripeErr) {
        console.warn("Не удалось получить сессию из Stripe:", stripeErr);
      }
    }

    if (dbUrl) {
      pgClient = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      await pgClient.connect();

      // 2. Ищем заказ в таблице orders
      let res;
      if (orderId) {
        res = await pgClient.query("SELECT * FROM orders WHERE id = $1;", [orderId]);
      } else if (sessionId) {
        res = await pgClient.query("SELECT * FROM orders WHERE stripe_session_id = $1;", [sessionId]);
      }

      let order = res && res.rows.length > 0 ? res.rows[0] : null;

      // 3. Если Stripe подтверждает оплату, но в БД еще pending — обновляем
      if (stripeSession && stripeSession.payment_status === "paid" && order && order.status !== "paid") {
        await pgClient.query(
          "UPDATE orders SET status = 'paid', stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id), updated_at = NOW() WHERE id = $2;",
          [stripeSession.payment_intent ? String(stripeSession.payment_intent) : null, order.id]
        );
        order.status = "paid";
      }

      if (order) {
        return NextResponse.json({
          success: true,
          order: {
            id: order.id,
            status: order.status,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            shippingAddress: order.shipping_address,
            shippingMethod: order.shipping_method,
            shippingCost: Number(order.shipping_cost),
            subtotal: Number(order.subtotal),
            discount: Number(order.discount),
            total: Number(order.total),
            currency: order.currency,
            items: order.items,
            createdAt: order.created_at,
          },
        });
      }
    }

    // 4. Резервный ответ из данных Stripe сессии (если БД была недоступна)
    if (stripeSession) {
      return NextResponse.json({
        success: true,
        order: {
          id: stripeSession.metadata?.orderId || orderId || "VG-ORDER",
          status: stripeSession.payment_status === "paid" ? "paid" : "pending",
          customerName: stripeSession.metadata?.customerName || "Cliente",
          customerEmail: stripeSession.customer_email || stripeSession.customer_details?.email,
          total: (stripeSession.amount_total || 0) / 100,
          currency: (stripeSession.currency || "eur").toUpperCase(),
          items: [],
        },
      });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (err: any) {
    console.error("Ошибка верификации заказа:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (pgClient) {
      await pgClient.end().catch(() => {});
    }
  }
}
