# Добавление кода торговой деятельности в Seguridad Social (CNAE 4791)

**Дата начала кейса:** 23 октября 2026 г.  
**Текущий статус:** Кейс успешно завершен (CNAE 4791 и актуальный адрес подтверждены в официальной выписке TGSS от 29.10.2026).

---

## 1. Суть проблемы и исходная ситуация (на 23.10.2026)

При анализе официальных выписок предпринимателя было выявлено критическое расхождение между налоговой службой (AEAT) и фондом социального страхования (TGSS):

1. **В налоговой службе (Hacienda / AEAT)**:
   - С 21/09/2026 открыта торговая деятельность по эпиграфу **IAE 665** (*Comercio Menor Por Correo o Catálogo* - код активности A03, международный NACE 47.91) со спецрежимом *recargo de equivalencia*.
   - Актуальный налоговый адрес: `Ronda Albocacer 11, 12166 Sierra Engarcerán (Castellón)`.
2. **В социальном страховании (TGSS / RETA)**:
   - В отчете `Informe actividades declaradas.pdf` от 23/10/2026 числились только IT-коды (6290, 6210, 6220 с 15/01/2024). Торговой деятельности не было.
   - Адрес деятельности в базе TGSS устарел: числился старый адрес `C/ Sant Antonio 22, Lucena del Cid`.

**Риски расхождения:** Несоответствие баз AEAT и TGSS блокирует авторизацию у европейских дистрибьюторов, создает проблемы при проверках Amazon/RAP/SCRAP и искажает расчет тарифов страхования от несчастных случаев (AT/EP).

---

## 2. Документы кейса

1. `certificado_situacion_censal_2026-09-23.pdf` - официальный сертификат налогового статуса AEAT от 23/09/2026 (№ ref. `20269409296`, CSV: `B2LR8ME9RKYAX683`). Подтверждает открытие IAE 665 с 21/09/2026.
2. `Informe actividades declaradas.pdf` - исходная выписка TGSS от 23/10/2026 12:12:46 (Id. CEA `2AE6KT5AECMW`). Зафиксировала отсутствие торгового кода в Seguridad Social.
3. `carta_para_gestor.md` - официальное письмо-запрос в онлайн-хесторию Taxfix ([taxfix.es](https://taxfix.es/)) на испанском языке с требованием добавить CNAE 4791 ретроспективно с 21/09/2026 и актуализировать адрес.
4. `justificante_nueva_actividad_2026-10-26.pdf` - официальная электронная квитанция TGSS от 26/10/2026 09:31:58 (Id. CEA `28DFII5B0DMY`, Código CEA `C7WLV-ONHXU-IV5FF-PDXI3-YN2HR-4GD3I`). Подтверждает успешную регистрацию новой деятельности CNAE 4791 / IAE 665.1.

---

## 3. Хроника событий и лог действий (Audit Log)

- **23.10.2026 12:12 - Выявление расхождения**:
  - В личном кабинете TGSS получен отчет `Informe actividades declaradas.pdf`. Подтверждено отсутствие торговых кодов.
- **23.10.2026 12:30 - Подготовка обращения к хестору**:
  - Составлено подробное письмо на испанском языке (`carta_para_gestor.md`) для хестора Jorge Dorado Rubio (Taxfix) с описанием расхождений, номерами справок и требованием внести CNAE 4791 с датой 21/09/2026.
- **23.10.2026 12:51 - Ответ от хестора (Jorge Dorado Rubio / Taxfix)**:
  - Хестор запросил оформить электронную доверенность:
    > *«¡Hola VITALII! Buenos días, dame apoderamiento para poder realizarlo. Adjunto documento de como hacer el apoderamiento.»*
- **24.10.2026 - Оформление электронной доверенности (Выполнено)**:
  - В Sede Electrónica Seguridad Social оформлена доверенность (*apoderamiento electrónico*) на имя Jorge Dorado Rubio (NIF 70356526D).
  - Хестору в чат отправлено подтверждение готовности доверенности.
  - Закрыта задача в Google Tasks: `[Legal]: Оформить apoderamiento для Taxfix (Jorge Dorado)` (ID: `Q21nTDY4Y3BIRE5Fa0JTMg`).
  - Создана контрольная задача на среду 28.10.2026 с расчетом на 2-3 рабочих дня ожидания подачи хестором.
- **26.10.2026 09:31 - Подача изменений хестором в TGSS (Выполнено)**:
  - Хестор Jorge Dorado Rubio внес в RETA новую деятельность от имени Vitalii Iasinskii:
    - Дата начала: `21/09/2026` (совпадает день в день с Hacienda).
    - Статус: `Trabajador por mi cuenta`.
    - Код CNAE: `4791` (*Actividades de servicios de intermediación para el comercio al por menor no especializado*).
    - Код IAE: `6651`.
    - Референция документа: Id. CEA `28DFII5B0DMY`, Código CEA `C7WLV-ONHXU-IV5FF-PDXI3-YN2HR-4GD3I`.
    - Файл квитанции: [justificante_nueva_actividad_2026-10-26.pdf](file:///Users/usuario/code/viasglobal/legal/autonomo/cnae-comercio-2026-10-23/justificante_nueva_actividad_2026-10-26.pdf).
- **26.10.2026 10:28 - Проверка квитанции и оптимизация напоминаний**:
  - ИИ проверил квитанцию и подтвердил корректность параметров (CNAE 4791, IAE 665.1, дата 21/09/2026).
  - Дублирующее событие в Google Календаре (ID: `3j66lil4b571455gikfh2bvdko`) удалено по правилу разграничения задач и встреч.
  - Контроль полностью перенесен в Google Tasks (ID: `T0ZDQW1tSV80OURId3lQVg`).
- **26.10.2026 10:58 - Актуализация описания задачи в Google Tasks**:
  - В задачу `[Legal]: Taxfix — Проконтролировать внесение CNAE 4791 и адреса в Seguridad Social` внесено обновленное описание с пошаговым чек-листом действий для проверки в среду.
- **29.10.2026 16:22 - Финальная проверка выписки TGSS (Выполнено успешно)**:
  - В личном кабинете Import@ss получен свежий отчет `Informe actividades declaradas.pdf` от 29/10/2026 16:22:24 (Id. CEA `2235SP5E5AWS`, Código CEA `NOKKY-XGY4F-BWLZZ-FSCVG-YKYYY-UIEJW`).
  - Проверено и подтверждено:
    1. Торговая деятельность **CNAE 4791** (*Actividades de servicios de intermediación para el comercio al por menor no especializado*) / **IAE 6651** отображается с корректной датой alta **21/09/2026** (день в день с Hacienda / AEAT).
    2. Адрес деятельности актуализирован: `ALBOCACER 11, Piso 19, Puerta 1, 12166, Ibarsos, els, Castelló/castellón`. Старый адрес в Lucena del Cid полностью заменен во всех видах активности.
    3. IT-деятельности (CNAE 6290, 6210, 6220 с 15/01/2024) также сохранены без ошибок.
  - Файлы сохранены в репозитории:
    - [Informe actividades declaradas_2026-10-29.pdf](file:///Users/usuario/code/viasglobal/legal/autonomo/cnae-comercio-2026-10-23/Informe%20actividades%20declaradas_2026-10-29.pdf)
    - [Informe actividades declaradas.pdf](file:///Users/usuario/code/viasglobal/legal/autonomo/Informe%20actividades%20declaradas.pdf)

---

## 4. Текущий статус

- **CNAE 4791 / IAE 665.1**: Зарегистрирован и отображается в сводной выписке Seguridad Social с даты 21/09/2026.
- **Адрес деятельности**: Полностью актуализирован во всех регистрах (`ALBOCACER 11, Piso 19, Puerta 1, 12166, Ibarsos, els, Castelló/castellón`).
- **Синхронизация баз**: Расхождение между AEAT и TGSS полностью устранено (100% соответствие). Кейс закрыт.

---

## 5. Выполненные действия (Roadmap)

### Завершенная задача в Google Tasks:
- **Задача**: `[Legal]: Taxfix — Проконтролировать внесение CNAE 4791 и адреса в Seguridad Social`
- **Дедлайн**: `2026-10-28`
- **ID**: `T0ZDQW1tSV80OURId3lQVg`
- **Прямая ссылка**: [Открыть в Google Tasks](https://tasks.google.com/task/OFCAmmI_49DHwyPV?sa=6)

### Чек-лист выполнения:
- [x] **29.10.2026**: Зайти в личный кабинет **Importass** (Sede Electrónica Seguridad Social) по прямой ссылке: [TGSS Import@ss - Informe de actividades declaradas](https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Vida+laboral+e+informes/Informes+sobre+tu+situacion+laboral/Informe+de+actividades+declaradas).
- [x] Скачать свежий отчет в формате PDF: **«Informe de actividades declaradas»**.
- [x] Проверить в скачанном отчете:
  1. Отображение активности CNAE 4791 с датой alta 21/09/2026 — **Подтверждено**.
  2. Отображение актуального адреса деятельности: `ALBOCACER 11, Els Ibarsos` — **Подтверждено**.
- [x] Сохранить полученный файл в директорию `legal/autonomo/` под именем `Informe actividades declaradas_2026-10-29.pdf`.
- [x] Данные сверены, расхождений нет (обращение к хестору не требуется).
- [x] Отметить задачу в Google Tasks как выполненную после подтверждения пользователя (выполнено 29.10.2026, ID: `T0ZDQW1tSV80OURId3lQVg`).








