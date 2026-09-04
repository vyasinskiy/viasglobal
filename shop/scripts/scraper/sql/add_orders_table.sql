-- ==============================================================================
-- Миграция: Создание таблицы заказов (orders) для интернет-магазина Viasglobal Shop
-- ==============================================================================
-- Сохраняет оформленные заказы, статусы Stripe Checkout, данные покупателей и состав чека
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY, -- Уникальный номер заказа магазина (например: 'VG-2026-849201')
  stripe_session_id text UNIQUE, -- Идентификатор сессии Stripe Checkout ('cs_test_...')
  stripe_payment_intent_id text, -- Идентификатор подтвержденного платежа ('pi_...')
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'canceled'
  
  -- Данные покупателя
  customer_name text NOT NULL, -- Имя и фамилия покупателя
  customer_email text NOT NULL, -- Email для чеков и уведомлений
  customer_phone text, -- Номер телефона
  customer_vat text, -- Номер NIF/CIF/VAT для юридических лиц
  
  -- Доставка и адрес
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb, -- { address, city, postalCode, country, notes }
  shipping_method text NOT NULL DEFAULT 'standard', -- 'standard', 'express', 'valencia_free'
  shipping_cost numeric(10, 2) NOT NULL DEFAULT 0, -- Стоимость доставки (€)
  
  -- Финансовые показатели
  subtotal numeric(10, 2) NOT NULL, -- Сумма товаров до скидок (€)
  discount numeric(10, 2) NOT NULL DEFAULT 0, -- Сумма скидки по промокоду (€)
  total numeric(10, 2) NOT NULL, -- Итоговая сумма к оплате с учетом доставки (€)
  currency text NOT NULL DEFAULT 'EUR', -- Валюта заказа
  
  -- Состав заказа
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- Массив купленных товаров со снимком цен и фото
  metadata jsonb DEFAULT '{}'::jsonb, -- Дополнительные метаданные (язык, промокод, user-agent)
  
  -- Временные метки
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Индексы для быстрой выборки заказов
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Комментарии к колонкам
COMMENT ON TABLE public.orders IS 'Таблица заказов интернет-магазина Viasglobal Shop с поддержкой Stripe';
COMMENT ON COLUMN public.orders.id IS 'Номер заказа в формате VG-YYYY-XXXXXX';
COMMENT ON COLUMN public.orders.stripe_session_id IS 'ID сессии Stripe Checkout Session';
COMMENT ON COLUMN public.orders.status IS 'Статус оплаты: pending, paid, failed, canceled';

COMMIT;
