import {
  extractApartments,
  extractAccounts,
  extractAccruals,
  checkIsLoginRequired,
  ExpiredSessionError,
  InvoiceNotFoundError,
  parsePeriodYearMonth,
  isExpectedPendingInvoice
} from './adapter';

describe('Логика извлечения данных KvartplataAdapter', () => {
  describe('extractApartments (Извлечение квартир)', () => {
    it('должен извлекать квартиры из сложной вложенной структуры данных', () => {
      // Подготавливаем тестовые данные с разными вариантами регистра ключей
      const payload = {
        data: [
          { id: 'apt-1', address: 'Main St 1', organization: 'Org A' },
          { Id: 'apt-2', Address: 'Main St 2', Organization: 'Org B' }
        ]
      };
      // Вызываем метод извлечения квартир
      const result = extractApartments(payload);
      // Проверяем количество и поля полученных квартир
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        externalId: 'apt-1',
        address: 'Main St 1',
        organization: 'Org A'
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        externalId: 'apt-2',
        address: 'Main St 2',
        organization: 'Org B'
      }));
    });

    it('должен дедуплицировать квартиры по externalId', () => {
      // Подготавливаем дублирующиеся записи для одной квартиры
      const payload = [
        { id: 'apt-1', address: 'Addr 1' },
        { apartmentId: 'apt-1', houseAddress: 'Addr 1 Dup' }
      ];
      // Вызываем метод извлечения квартир
      const result = extractApartments(payload);
      // Проверяем, что осталась только одна уникальная квартира
      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe('apt-1');
    });
  });

  describe('extractAccounts (Извлечение лицевых счетов)', () => {
    const mockApartment = { externalId: 'apt-1', address: 'Addr 1', organization: 'Org 1', rawJson: '{}' };

    it('должен извлекать лицевые счета с корректным балансом', () => {
      // Тестовый ответ API с разными форматами баланса и задолженности
      const payload = {
        accounts: [
          { id: 'acc-1', number: '123', serviceName: 'Utilities', balance: -100.50 },
          { ls: 'acc-2', debt: '500,25', organizationName: 'TSJ' }
        ]
      };
      // Извлекаем лицевые счета
      const result = extractAccounts(mockApartment, payload);
      // Проверяем корректность парсинга названий и числового баланса
      expect(result).toHaveLength(2);
      expect(result[0].accountLabel).toBe('Utilities');
      expect(result[0].balance).toBe(-100.50);
      expect(result[1].accountLabel).toBe('TSJ');
      expect(result[1].balance).toBe(500.25);
    });
  });

  describe('extractAccruals (Извлечение начислений)', () => {
    const mockAccount = { externalId: 'acc-1', apartmentExternalId: 'apt-1', accountNumber: '123', accountLabel: 'Label', rawJson: '{}' };

    it('должен извлекать начисления с различными полями сумм', () => {
      // Формируем тестовые начисления с квитанцией
      const payload = {
        accruals: [
          {
            periodId: '202605',
            name: 'Май 2026',
            accruedAmount: '100.50',
            amountToPay: '110.00',
            button: { invoice: 'true' }
          }
        ]
      };
      // Извлекаем начисления
      const result = extractAccruals(mockAccount, payload);
      // Проверяем поля начисления и сводный текст сумм
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        accountExternalId: 'acc-1',
        periodId: '202605',
        periodLabel: 'Май 2026'
      }));
      expect(result[0].amountText).toContain('accruedAmount=100.50');
      expect(result[0].amountText).toContain('amountToPay=110.00');
      expect(result[0].statusText).toContain('button.invoice=true');
    });

    it('должен использовать periodLabel в качестве periodId при его отсутствии', () => {
      // Тестовые данные без явного поля periodId
      const payload = {
        Accruals: [
          { month: 'Июнь 2026', sum: '50.00' }
        ]
      };
      // Извлекаем начисления
      const result = extractAccruals(mockAccount, payload);
      // Проверяем запасной вариант для идентификатора периода
      expect(result[0].periodId).toBe('Июнь 2026');
      expect(result[0].periodLabel).toBe('Июнь 2026');
    });
  });

  describe('Детекция авторизации и истекшей сессии (checkIsLoginRequired)', () => {
    it('должен требовать авторизацию при редиректе на промо-лендинг (корень сайта без /new-web/)', () => {
      // URL редиректа на публичный корень сайта
      const currentUrl = 'https://xn--80aaaf3bi1ahsd.xn--80asehdb/';
      // Текст публичного лендинга со словами "личный кабинет" и кнопкой "Войти"
      const bodyText = 'Управляющим организациям Единый личный кабинет жителя Передача показаний электронные квитанции история начислений Войти';

      // Вызываем проверку необходимости авторизации
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);

      // Проверяем, что система зафиксировала необходимость входа
      expect(needsLogin).toBe(true);
    });

    it('должен требовать авторизацию при редиректе на страницу входа (/login)', () => {
      // URL страницы авторизации
      const currentUrl = 'https://new.kvartplata.online/login';
      const bodyText = 'Пожалуйста, войдите в личный кабинет';

      // Проверяем детекцию логина
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);
      expect(needsLogin).toBe(true);
    });

    it('должен требовать авторизацию, если внутри /new-web/ отображается форма входа или капча', () => {
      // URL внутри пути приложения, но с формой авторизации
      const currentUrl = 'https://new.kvartplata.online/new-web/apartments';
      const bodyText = 'Подтвердите вход: введите captcha с картинки. Войти в аккаунт.';

      // Проверяем детекцию капчи/входа
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);
      expect(needsLogin).toBe(true);
    });

    it('должен подтверждать валидность сессии, если URL в /new-web/ и отображаются данные кабинета', () => {
      // URL авторизованного личного кабинета
      const currentUrl = 'https://new.kvartplata.online/new-web/apartments';
      // Контент страницы авторизованного пользователя
      const bodyText = 'Личный кабинет жителя. Лицевой счет 987654. Начисления за текущий период. Квитанция доступна для скачивания. Выйти';

      // Проверяем сессию
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);
      // Авторизация не требуется, сессия активна
      expect(needsLogin).toBe(false);
    });

    it('должен подтверждать валидность сессии на новом домене лк.квартплата.онлайн с ID аккаунта', () => {
      // Новый URL авторизованного личного кабинета с номером Л/С
      const currentUrl = 'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/378621';
      // Контент страницы авторизованного пользователя (баланс, помещения, лицевые счета)
      const bodyText = 'Квартплата Онлайн. Баланс -107 218. Помещения Краснодар Лукьяненко. Лицевые счета.';

      // Проверяем сессию
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);
      // Авторизация не требуется, сессия активна
      expect(needsLogin).toBe(false);
    });

    it('должен подтверждать валидность сессии по навигационным элементам меню кабинета (Счётчики, Платежи, Заявки, Магазин)', () => {
      // URL корня личного кабинета
      const currentUrl = 'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/';
      // Меню навигации личного кабинета
      const bodyText = 'Главная Счётчики Платежи Заявки Магазин';

      // Проверяем сессию
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);
      // Авторизация не требуется, сессия активна
      expect(needsLogin).toBe(false);
    });

    it('должен требовать авторизацию, если страница пустая или не содержит сигналов готовности', () => {
      // Пустая страница или ошибка рендеринга
      const currentUrl = 'https://new.kvartplata.online/new-web/apartments';
      const bodyText = ' ';

      // Проверяем сессию при пустом содержимом
      const needsLogin = checkIsLoginRequired(currentUrl, bodyText);
      expect(needsLogin).toBe(true);
    });
  });

  describe('Класс ошибки ExpiredSessionError', () => {
    it('должен корректно наследоваться от Error и содержать имя ExpiredSessionError', () => {
      // Создаем экземпляр ошибки истекшей сессии
      const error = new ExpiredSessionError('Сессия истекла');
      // Проверяем тип и свойства
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ExpiredSessionError');
      expect(error.message).toBe('Сессия истекла');
    });
  });

  describe('Класс ошибки InvoiceNotFoundError', () => {
    it('должен содержать HTTP статус 404 и корректное имя класса', () => {
      // Создаем экземпляр ошибки отсутствия квитанции
      const error = new InvoiceNotFoundError(404, 'Failed to download invoice: 404');
      // Проверяем статус и прототип
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvoiceNotFoundError');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Failed to download invoice: 404');
    });
  });

  describe('Функция parsePeriodYearMonth (Парсинг периода начислений)', () => {
    it('должен корректно разбирать числовой формат YYYYMM (202610)', () => {
      // Разбор периода из пользовательского отчета
      const result = parsePeriodYearMonth('202610');
      expect(result).toEqual({ year: 2026, month: 10 });
    });

    it('должен корректно разбирать формат с дефисом YYYY-MM (2026-10)', () => {
      // Разбор периода через разделитель
      const result = parsePeriodYearMonth('2026-10');
      expect(result).toEqual({ year: 2026, month: 10 });
    });

    it('должен корректно разбирать формат с точкой MM.YYYY (10.2026)', () => {
      // Разбор периода в европейском формате
      const result = parsePeriodYearMonth('10.2026');
      expect(result).toEqual({ year: 2026, month: 10 });
    });

    it('должен корректно разбирать текстовое название месяца на русском (Октябрь 2026, Май 2026)', () => {
      // Разбор текстовых периодов
      expect(parsePeriodYearMonth('Октябрь 2026')).toEqual({ year: 2026, month: 10 });
      expect(parsePeriodYearMonth('Май 2026')).toEqual({ year: 2026, month: 5 });
    });

    it('должен корректно разбирать текстовое название месяца на английском (July 2026)', () => {
      // Разбор английского месяца
      expect(parsePeriodYearMonth('July 2026')).toEqual({ year: 2026, month: 7 });
    });

    it('должен возвращать null для некорректных или пустых строк', () => {
      // Проверка некорректных значений
      expect(parsePeriodYearMonth('')).toBeNull();
      expect(parsePeriodYearMonth(undefined)).toBeNull();
      expect(parsePeriodYearMonth('invalid')).toBeNull();
    });
  });

  describe('Функция isExpectedPendingInvoice (Проверка ожидаемой ошибки 404)', () => {
    const fixedNow = new Date('2026-10-27T12:00:00Z');

    it('должен возвращать true для инвойса текущего месяца (период 202610 в октябре 2026)', () => {
      // Эталонный случай из запроса пользователя
      const invoice = {
        accountExternalId: '6603378',
        periodLabel: '202610',
        periodId: '202610',
        available: true,
        uploadedToStorage: false
      };
      const result = isExpectedPendingInvoice(invoice, [invoice], fixedNow);
      expect(result).toBe(true);
    });

    it('должен возвращать true для предыдущего месяца, если это самый свежий период счета (октябрь в начале ноября)', () => {
      // Ноябрь 2026 года, квитанция за октябрь еще не опубликована управляющей компанией
      const nowInNovember = new Date('2026-11-05T12:00:00Z');
      const invoice = {
        accountExternalId: '3475821',
        periodLabel: '202610',
        periodId: '202610',
        available: true,
        uploadedToStorage: false
      };
      const allInvoices = [
        { accountExternalId: '3475821', periodLabel: '202609', periodId: '202609', available: true, uploadedToStorage: true },
        invoice
      ];
      const result = isExpectedPendingInvoice(invoice, allInvoices, nowInNovember);
      expect(result).toBe(true);
    });

    it('должен возвращать false для старых периодов (например, 202607 в октябре 2026)', () => {
      // Старая квитанция за июль, отсутствующая в конце октября, свидетельствует о реальной проблеме
      const oldInvoice = {
        accountExternalId: '464655',
        periodLabel: '202607',
        periodId: '202607',
        available: true,
        uploadedToStorage: false
      };
      const result = isExpectedPendingInvoice(oldInvoice, [oldInvoice], fixedNow);
      expect(result).toBe(false);
    });
  });
});

