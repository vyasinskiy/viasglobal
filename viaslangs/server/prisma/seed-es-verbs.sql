INSERT INTO vy_words (language_id, english, russian, example_en, example_ru)
SELECT l.id, v.english, v.russian, v.example_en, v.example_ru
FROM (VALUES
    ('enviar', 'отправлять', 'Le enviaré el catálogo actualizado por correo electrónico.', 'Я отправлю вам обновлённый каталог по электронной почте.'),
    ('pedir', 'заказывать, просить', 'Queremos pedir 500 unidades de su producto estrella.', 'Мы хотим заказать 500 единиц вашего основного продукта.'),
    ('solicitar', 'запрашивать', 'Necesito solicitar el precio de venta al por mayor.', 'Мне нужно запросить оптовую цену.'),
    ('necesitar', 'нуждаться', 'Necesitamos su ayuda para resolver este problema con el pedido.', 'Нам нужна ваша помощь в решении этой проблемы с заказом.'),
    ('recibir', 'получать', '¿Cuándo recibiremos el primer envío?', 'Когда мы получим первую партию?'),
    ('costar', 'стоить', '¿Cuánto cuesta una unidad con el descuento por volumen?', 'Сколько стоит одна единица со скидкой за объём?'),
    ('pagar', 'платить', 'Estamos dispuestos a pagar el 30% por adelantado.', 'Мы готовы платить 30% авансом.'),
    ('cobrar', 'взимать плату', '¿Nos cobrarán los gastos de envío por separado?', 'Вы возьмёте с нас плату за доставку отдельно?'),
    ('facturar', 'выставлять счёт', 'El proveedor nos factura en euros cada mes.', 'Поставщик выставляет нам счёт в евро каждый месяц.'),
    ('comprar', 'покупать', 'Compramos estos productos para revenderlos en nuestra tienda.', 'Мы покупаем эту продукцию, чтобы перепродавать её в нашем магазине.'),
    ('vender', 'продавать', 'Esta empresa vende sus productos en toda Europa.', 'Эта компания продаёт свою продукцию по всей Европе.'),
    ('ofrecer', 'предлагать', '¿Puede ofrecernos un mejor precio para pedidos grandes?', 'Можете ли вы предложить нам лучшую цену для больших заказов?'),
    ('entregar', 'доставлять', 'El transportista entregará la mercancía el lunes por la mañana.', 'Перевозчик доставит товар в понедельник утром.'),
    ('despachar', 'отправлять груз', 'Despacharemos su pedido en cuanto recibamos el pago.', 'Мы отправим ваш заказ, как только получим оплату.'),
    ('importar', 'импортировать', 'Importamos mercancía directamente de España.', 'Мы импортируем товары напрямую из Испании.'),
    ('exportar', 'экспортировать', 'Su empresa exporta a más de veinte países.', 'Ваша компания экспортирует более чем в двадцать стран.'),
    ('llegar', 'прибывать', 'El contenedor llegará al puerto la próxima semana.', 'Контейнер прибудет в порт на следующей неделе.'),
    ('fabricar', 'изготавливать', 'Fabricamos los productos bajo pedido en nuestra fábrica en Valencia.', 'Мы изготавливаем продукцию под заказ на нашей фабрике в Валенсии.'),
    ('producir', 'производить', 'La fábrica produce mil unidades al día.', 'Фабрика производит тысячу единиц в день.'),
    ('personalizar', 'делать на заказ', 'Podemos personalizar el embalaje con el logotipo del cliente.', 'Мы можем кастомизировать упаковку с логотипом клиента.'),
    ('confirmar', 'подтверждать', 'Por favor, confirme la fecha de entrega por escrito.', 'Пожалуйста, подтвердите дату поставки в письменном виде.'),
    ('preguntar', 'спрашивать', 'Quiero preguntarle sobre las condiciones de pago.', 'Я хочу спросить вас об условиях оплаты.'),
    ('responder', 'отвечать', 'Le rogamos que responda a nuestra solicitud lo antes posible.', 'Просим вас ответить на наш запрос как можно скорее.'),
    ('informar', 'информировать', 'Le informaremos sobre cualquier cambio en el plazo de entrega.', 'Мы проинформируем вас о любых изменениях сроков поставки.'),
    ('avisar', 'уведомлять', 'Avísenos si hay algún retraso en la producción.', 'Сообщите нам, если будет задержка в производстве.'),
    ('contactar', 'связываться', 'Puede contactar con nuestro gestor de pedidos por teléfono.', 'Вы можете связаться с нашим менеджером по заказам по телефону.'),
    ('negociar', 'вести переговоры', 'Estos son los precios que podemos negociar para contratos anuales.', 'Это цены, которые мы можем обсудить для годовых контрактов.'),
    ('aceptar', 'принимать условия', 'Aceptamos las condiciones de pago propuestas por el proveedor.', 'Мы принимаем условия оплаты, предложенные поставщиком.'),
    ('rechazar', 'отклонять', 'El proveedor rechazó nuestra propuesta de precio inicial.', 'Поставщик отклонил наше первоначальное ценовое предложение.'),
    ('acordar', 'договариваться', 'Acordamos un plazo de entrega de dos semanas.', 'Мы договорились о сроке поставки в две недели.'),
    ('decidir', 'решать', 'Debemos decidir el volumen del pedido antes del viernes.', 'Нам нужно решить объём заказа до пятницы.'),
    ('revisar', 'проверять', 'Me gustaría revisar el contrato antes de firmarlo.', 'Я хотел бы проверить контракт перед подписанием.'),
    ('preparar', 'подготавливать', 'Prepararemos la documentación de exportación esta semana.', 'Мы подготовим экспортную документацию на этой неделе.'),
    ('firmar', 'подписывать', 'Debe firmar el acuerdo de suministro para iniciar la colaboración.', 'Вы должны подписать соглашение о поставке, чтобы начать сотрудничество.'),
    ('adjuntar', 'прикреплять', 'Le adjunto la oferta con los precios actualizados.', 'Прикрепляю вам предложение с актуальными ценами.'),
    ('transferir', 'переводить деньги', 'Transferiremos el pago a su cuenta bancaria mañana.', 'Мы переведём платёж на ваш банковский счёт завтра.'),
    ('abonar', 'зачислять', 'Abonaremos el importe restante tras la entrega.', 'Мы выплатим оставшуюся сумму после поставки.'),
    ('reembolsar', 'возвращать деньги', 'Si el producto llega dañado, le reembolsaremos el importe.', 'Если товар приедет повреждённым, мы вернём вам сумму.'),
    ('devolver', 'возвращать товар', 'Puede devolver la mercancía defectuosa en un plazo de 14 días.', 'Вы можете вернуть бракованный товар в течение 14 дней.'),
    ('reclamar', 'предъявлять претензию', 'Vamos a reclamar los daños causados durante el transporte.', 'Мы собираемся предъявить претензию по поводу повреждений во время перевозки.'),
    ('resolver', 'решать проблему', 'Esperamos resolver este problema con la calidad lo antes posible.', 'Мы надеемся как можно скорее решить эту проблему с качеством.'),
    ('solucionar', 'устранять', 'Nuestro equipo técnico solucionará la incidencia en 24 horas.', 'Наша техническая команда устранит неполадку в течение 24 часов.'),
    ('verificar', 'проверять наличие', 'Verificaremos el stock disponible antes de confirmar el pedido.', 'Мы проверим наличие на складе перед подтверждением заказа.'),
    ('comprobar', 'убеждаться', 'Compruebe si el número de cuenta bancaria es correcto.', 'Проверьте, правильный ли номер банковского счёта.'),
    ('garantizar', 'гарантировать', 'Le garantizamos la calidad de todos nuestros productos.', 'Мы гарантируем качество всей нашей продукции.'),
    ('cumplir', 'выполнять', 'El proveedor cumple todos los plazos acordados.', 'Поставщик соблюдает все согласованные сроки.'),
    ('asegurar', 'обеспечивать', 'Debemos asegurar el transporte seguro de la mercancía.', 'Мы должны обеспечить безопасную перевозку товара.'),
    ('intentar', 'пытаться', 'Intentaremos reducir el tiempo de entrega en un 10%.', 'Мы постараемся сократить время доставки на 10%.'),
    ('esperar', 'ожидать', 'Esperamos su respuesta para continuar con el pedido.', 'Ждём вашего ответа, чтобы продолжить работу над заказом.'),
    ('hablar', 'говорить', 'Me gustaría hablar con el responsable de ventas.', 'Я хотел бы поговорить с ответственным за продажи.')
) AS v(english, russian, example_en, example_ru)
CROSS JOIN vy_languages l
WHERE l.code = 'es'
  AND NOT EXISTS (
    SELECT 1 FROM vy_words w
    WHERE w.language_id = l.id
      AND lower(w.english) = lower(v.english)
      AND lower(w.russian) = lower(v.russian)
  );