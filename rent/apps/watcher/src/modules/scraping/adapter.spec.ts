import { extractApartments, extractAccounts, extractAccruals, checkIsLoginRequired, ExpiredSessionError } from './adapter';

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
});

