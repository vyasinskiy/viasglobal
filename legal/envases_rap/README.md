# Envases RAP — Registro y cumplimiento (autónomo, wholesale Amazon)

Directorio para самостоятельного оформления RAP-номера упаковки в Испании
(Responsabilidad Ampliada del Productor, envases) продавцом-autónomo
по модели wholesale на Amazon.

## Структура

- `instruccion_registro_RAP_autonomo.md` — пошаговая инструкция:
  определение статуса productor, выбор SCRAP, inscripción RPP
  с подписью FNMT, внесение номера в Amazon, ежегодные декларации.
- `certificados/` — certificados de pertenencia a SCRAP, contratos de adhesión,
  PDF `datosFormulario.pdf` с номером `ENV/...`, скриншоты/PDF подтверждения Amazon.
- `declaraciones/` — годовые декларации: в SCRAP (личный кабинет/HUB)
  и в RPP (Sede MITERD), файл учёта кг по материалам.
- `facturas/` — шаблоны facturas с номером RPP, facturas покупки/продажи
  для подтверждения учёта упаковки.

## Правила именования

Оригиналы хранить с понятными именами на испанском или латинице:

- `certificado_scrap_<SCRAP>_<AAAA>.pdf`
- `contrato_adhesion_<SCRAP>_<AAAA-MM-DD>.pdf`
- `datosFormulario_RPP_ENV_<AAAA>.pdf`
- `confirmacion_amazon_RAP_<AAAA-MM-DD>.pdf`
- `declaracion_RPP_<AAAA>_presentada_<AAAA-MM-DD>.pdf`
- `declaracion_SCRAP_<SCRAP>_<AAAA>.pdf`
- `registro_envases_kg_<AAAA>.xlsx`
- `factura_venta_<NUM>_<AAAA-MM-DD>.pdf`

## Статус

- [ ] Шаг 1: выбран SCRAP, подписан contrato de adhesión
- [ ] Шаг 2: получен certificado de pertenencia
- [ ] Шаг 3: inscripción RPP, получен номер ENV/...
- [ ] Шаг 4: номер внесён в facturas и в Seller Central Amazon
- [ ] Шаг 5: настроен учёт кг по материалам (registro_envases_kg)
- [ ] Ежегодно до 31.03: декларации в SCRAP и в RPP

Контакты MITERD: `bzn-rpp@miteco.es` (регистр, декларации),
`buzon-sgr@miteco.es` (толкование RD 1055/2022), тел. 917284813.
