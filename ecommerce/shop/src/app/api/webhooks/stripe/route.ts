import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { Client } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Webhook эндпоинт для обработки событий от Stripe
 * POST /api/webhooks/stripe
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: any;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // В локальной разработке без заданного секрета
      event = JSON.parse(rawBody);
    }
  } catch (err: any) {
    console.error(`❌ Ошибка проверки подписи Stripe Webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const dbUrl = process.env.DATABASE_URL;
  let pgClient: Client | null = null;

  try {
    if (dbUrl) {
      pgClient = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      await pgClient.connect();
    }

    switch (event.type) {
      // 1. Успешное завершение оформления заказа в Stripe Checkout
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        const sessionId = session.id;
        const paymentIntentId = session.payment_intent ? String(session.payment_intent) : null;

        console.log(`✅ Stripe Webhook: Заказ ${orderId || sessionId} успешно оплачен!`);

        if (pgClient) {
          if (orderId) {
            await pgClient.query(
              `UPDATE orders 
               SET status = 'paid',
                   stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
                   stripe_session_id = COALESCE($2, stripe_session_id),
                   updated_at = NOW()
               WHERE id = $3;`,
              [paymentIntentId, sessionId, orderId]
            );
          } else {
            await pgClient.query(
              `UPDATE orders 
               SET status = 'paid',
                   stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
                   updated_at = NOW()
               WHERE stripe_session_id = $2;`,
              [paymentIntentId, sessionId]
            );
          }
        }
        break;
      }

      // 2. Успешное проведение платежа
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`💳 Stripe Webhook: PaymentIntent ${paymentIntent.id} подтвержден.`);
        break;
      }

      // 3. Ошибка при списании средств
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const errorMsg = paymentIntent.last_payment_error?.message || "Payment failed";
        console.warn(`❌ Stripe Webhook: Ошибка платежа ${paymentIntent.id}: ${errorMsg}`);

        if (pgClient) {
          await pgClient.query(
            `UPDATE orders 
             SET status = 'failed',
                 metadata = metadata || jsonb_build_object('payment_error', $1::text),
                 updated_at = NOW()
             WHERE stripe_payment_intent_id = $2;`,
            [errorMsg, paymentIntent.id]
          );
        }
        break;
      }

      default:
        // Прочие события
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Ошибка в обработчике Stripe Webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (pgClient) {
      await pgClient.end().catch(() => {});
    }
  }
}
