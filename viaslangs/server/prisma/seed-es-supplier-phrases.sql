-- Добавление нового пакета бизнес-выражений и лексики для общения с поставщиками (испанский язык)

-- 1. Создание или обновление тега для испанского языка
INSERT INTO vy_tags (language_id, name)
SELECT l.id, 'Для общения с поставщиками'
FROM vy_languages l
WHERE l.code = 'es'
ON CONFLICT (language_id, name) DO UPDATE SET name = EXCLUDED.name;

-- 2. Вставка новых слов и выражений
INSERT INTO vy_words (language_id, english, russian, example_en, example_ru)
SELECT l.id, v.english, v.russian, v.example_en, v.example_ru
FROM (VALUES
    ('fecha de entrega', 'дата поставки, срок поставки', 'Por favor, infórmenos sobre la fecha de entrega estimada de este lote.', 'Пожалуйста, сообщите нам ориентировочную дату поставки этой партии.'),
    ('por escrito', 'в письменном виде, письменно', 'Para evitar malentendidos, preferimos cerrar todos los acuerdos por escrito.', 'Чтобы избежать недоразумений, мы предпочитаем заключать все договоренности в письменном виде.'),
    ('producto estrella', 'флагманский продукт, хит продаж', 'Este modelo es su producto estrella y queremos incluirlo en nuestro catálogo.', 'Эта модель — их флагманский продукт, и мы хотим включить её в наш каталог.'),
    ('gestor de pedidos', 'менеджер по заказам', 'Nuestro gestor de pedidos le enviará la factura proforma en cuanto esté lista.', 'Наш менеджер по заказам отправит вам счёт-проформу, как только он будет готов.'),
    ('el proveedor', 'поставщик', 'El proveedor nos ofreció un descuento adicional del cinco por ciento por volumen de compra.', 'Поставщик предложил нам дополнительную скидку 5% за объём закупки.'),
    ('propuesta', 'предложение, коммерческое предложение', 'Hemos analizado su propuesta y estamos dispuestos a realizar el primer pedido de prueba.', 'Мы проанализировали ваше предложение и готовы сделать первый тестовый заказ.'),
    ('bajo pedido', 'под заказ', 'No tenemos este artículo en stock, ya que se fabrica exclusivamente bajo pedido.', 'У нас нет этого товара на складе, так как он производится исключительно под заказ.'),
    ('por separado', 'отдельно, по отдельности', 'Los costes de transporte y embalaje especial se facturan por separado.', 'Стоимость транспортировки и специальной упаковки оплачивается отдельно.'),
    ('en cuanto', 'как только', 'Le enviaremos el comprobante de transferencia en cuanto realicemos el pago.', 'Мы отправим вам подтверждение перевода, как только совершим платёж.'),
    ('retraso', 'задержка, опоздание', 'Cualquier retraso en la entrega puede afectar negativamente a nuestras ventas.', 'Любая задержка в поставке может негативно сказаться на наших продажах.'),
    ('los plazos acordados', 'согласованные сроки', 'Es imprescindible respetar los plazos acordados para no retrasar el lanzamiento.', 'Крайне важно соблюдать согласованные сроки, чтобы не задержать запуск.'),
    ('el importe restante', 'оставшаяся сумма, остаток суммы', 'Abonaremos el importe restante una vez comprobada la calidad de los productos.', 'Мы выплатим оставшуюся сумму после того, как проверим качество продукции.'),
    ('tras la entrega', 'после поставки, после доставки', 'Disponemos de un plazo de siete días tras la entrega para notificar cualquier incidencia.', 'У нас есть 7 дней после поставки, чтобы заявить о любых инцидентах.')
) AS v(english, russian, example_en, example_ru)
CROSS JOIN vy_languages l
WHERE l.code = 'es'
  AND NOT EXISTS (
    SELECT 1 FROM vy_words w
    WHERE w.language_id = l.id
      AND lower(w.english) = lower(v.english)
  );

-- 3. Привязка слов к тегу «Для общения с поставщиками»
INSERT INTO vy_word_tags (word_id, tag_id)
SELECT w.id, t.id
FROM vy_words w
CROSS JOIN (
  SELECT t.id
  FROM vy_tags t
  JOIN vy_languages l ON l.id = t.language_id
  WHERE t.name = 'Для общения с поставщиками'
    AND l.code = 'es'
) t
WHERE w.language_id = (SELECT id FROM vy_languages WHERE code = 'es')
  AND lower(w.english) IN (
    'fecha de entrega',
    'por escrito',
    'producto estrella',
    'gestor de pedidos',
    'el proveedor',
    'propuesta',
    'bajo pedido',
    'por separado',
    'en cuanto',
    'retraso',
    'los plazos acordados',
    'el importe restante',
    'tras la entrega'
  )
ON CONFLICT DO NOTHING;
