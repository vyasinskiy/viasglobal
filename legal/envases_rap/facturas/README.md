# Требования к счетам-фактурам (Facturas) и номеру RPP

Согласно **статье 11.3 Королевского указа 1055/2022 от 27 декабря** (*Real Decreto 1055/2022, de 27 de diciembre, de envases y residuos de envases*):

> *«Los productores de producto deberán incluir el número de identificación del Registro de Productores de Producto en las facturas y cualquier otro documento que acompañe a las transacciones comerciales de productos envasados que realicen con otros operadores económicos o consumidores finales.»*

## Обязательная строка в реквизитах инвойса

В нижней части или в блоке реквизитов продавца (рядом с NIF, адресом и наименованием) на всех выставляемых счетах-фактурах (*facturas de venta*), коммерческих предложениях и транспортных накладных (albaranes) **обязательно указывается регистрационный номер**:

```text
N.º de Registro de Productores de Producto (Sección Envases): ENV/2026/000121685
```

Короткий вариант (для компактных шаблонов и чеков):
```text
N.º Reg. Prod. Producto (Envases): ENV/2026/000121685
```

## Для чего это нужно:
1. **B2B клиенты и дистрибьюторы**: оптовые покупатели в Испании обязаны проверять, что поставщик выполняет обязательства RAP по упаковке.
2. **Проверки налоговой (AEAT) и экологической инспекции (MITECO)**: отсутствие номера на фактурах при продаже упакованного товара является нарушением статьи 11.3 RD 1055/2022.
3. **Автоматическая верификация Amazon / маркетплейсов**: при запросе выборочных инвойсов (VCS / Amazon Invoicing) номер в колонтитуле подтверждает статус зарегистрированного производителя.
