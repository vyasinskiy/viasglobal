import { normalizeManufacturerName } from '../../scripts/parse-keepa';

describe('Функция normalizeManufacturerName (нормализация и очистка производителей)', () => {
  describe('Очистка вендор-кодов и служебных кодов Amazon в круглых скобках', () => {
    it('должна отрезать вендор-код Amazon Vendor Central (COFB0) у COFAN', () => {
      // Кейс из задачи пользователя: COFAN (COFB0) должен объединяться с COFAN
      expect(normalizeManufacturerName('COFAN (COFB0)')).toBe('COFAN');
      expect(normalizeManufacturerName('COFAN')).toBe('COFAN');
      expect(normalizeManufacturerName('cofan (cofb0)')).toBe('COFAN');
    });

    it('должна отрезать вендор-коды других брендов Amazon (MAMQ3, EMOS5, PUTJ7, VEUI5, CES7F, DUNMR)', () => {
      expect(normalizeManufacturerName('MAMMUT (MAMQ3)')).toBe('MAMMUT');
      expect(normalizeManufacturerName('EMOS (EMOS5)')).toBe('EMOS');
      expect(normalizeManufacturerName('PURINA (PUTJ7)')).toBe('PURINA');
      expect(normalizeManufacturerName('VERSELE LAGA (VEUI5)')).toBe('VERSELE LAGA');
      expect(normalizeManufacturerName("CERDÁ LIFE'S LITTLE MOMENTS (CES7F)")).toBe("CERDÁ LIFE'S LITTLE MOMENTS");
      expect(normalizeManufacturerName('DUNLOP VECHILE (DUNMR)')).toBe('DUNLOP VECHILE');
      expect(normalizeManufacturerName('STAMPERIA INTL, KFT (3PL)')).toBe('STAMPERIA INTL, KFT');
    });
  });

  describe('Унификация правовых форм испанских и европейских компаний', () => {
    it('должна приводить все вариации ALFA DYSER к единому эталону "ALFA DYSER, S.L."', () => {
      // Кейс из задачи пользователя: ALFA DYSER, S.L / ALFA DYSER S.L / ALFA DYSER S.L.
      expect(normalizeManufacturerName('ALFA DYSER, S.L')).toBe('ALFA DYSER, S.L.');
      expect(normalizeManufacturerName('ALFA DYSER S.L')).toBe('ALFA DYSER, S.L.');
      expect(normalizeManufacturerName('ALFA DYSER S.L.')).toBe('ALFA DYSER, S.L.');
      expect(normalizeManufacturerName('ALFA DYSER, S.L.')).toBe('ALFA DYSER, S.L.');
      expect(normalizeManufacturerName('alfa dyser s.l')).toBe('ALFA DYSER, S.L.');
    });

    it('должна унифицировать вариации Sociedad Limitada (S.L. / SL)', () => {
      expect(normalizeManufacturerName('ACRYLICOS VALLEJO SL')).toBe('ACRYLICOS VALLEJO, S.L.');
      expect(normalizeManufacturerName('ACRYLICOS VALLEJO, S.L.')).toBe('ACRYLICOS VALLEJO, S.L.');
      expect(normalizeManufacturerName('COLORBABY SL')).toBe('COLORBABY, S.L.');
      expect(normalizeManufacturerName('COLORBABY S.L.')).toBe('COLORBABY, S.L.');
      expect(normalizeManufacturerName('ISOGONA SL')).toBe('ISOGONA, S.L.');
      expect(normalizeManufacturerName('ISOGONA S.L.')).toBe('ISOGONA, S.L.');
      expect(normalizeManufacturerName('NEVENON GROUP SL')).toBe('NEVENON GROUP, S.L.');
      expect(normalizeManufacturerName('NEVENON GROUP S.L')).toBe('NEVENON GROUP, S.L.');
    });

    it('должна унифицировать вариации Sociedad Limitada Unipersonal (S.L.U. / SLU)', () => {
      expect(normalizeManufacturerName('ACRYLICOS VALLEJO SLU')).toBe('ACRYLICOS VALLEJO, S.L.U.');
      expect(normalizeManufacturerName('ACRYLICOS VALLEJO, SLU')).toBe('ACRYLICOS VALLEJO, S.L.U.');
      expect(normalizeManufacturerName('BELLOTA HERRAMIENTAS SLU')).toBe('BELLOTA HERRAMIENTAS, S.L.U.');
      expect(normalizeManufacturerName('BELLOTA HERRAMIENTAS S.L.U.')).toBe('BELLOTA HERRAMIENTAS, S.L.U.');
    });

    it('должна унифицировать вариации Sociedad Anónima (S.A. / SA)', () => {
      expect(normalizeManufacturerName('PLÁSTICOS TATAY S.A.')).toBe('PLÁSTICOS TATAY, S.A.');
      expect(normalizeManufacturerName('PRODUCTOS FLOWER SA')).toBe('PRODUCTOS FLOWER, S.A.');
      expect(normalizeManufacturerName('PRODUCTOS FLOWER, S.A.')).toBe('PRODUCTOS FLOWER, S.A.');
      expect(normalizeManufacturerName('NESTLE ESPAÑA S.A.')).toBe('NESTLE ESPAÑA, S.A.');
      expect(normalizeManufacturerName('NESTLE ESPAÑA, S.A.')).toBe('NESTLE ESPAÑA, S.A.');
    });

    it('должна унифицировать вариации Sociedad Anónima Unipersonal (S.A.U. / SAU)', () => {
      expect(normalizeManufacturerName('INDUSTRIAS COSMIC SAU')).toBe('INDUSTRIAS COSMIC, S.A.U.');
      expect(normalizeManufacturerName('INDUSTRIAS COSMIC, S.A.U.')).toBe('INDUSTRIAS COSMIC, S.A.U.');
      expect(normalizeManufacturerName('APLI PAPER S.A.U.')).toBe('APLI PAPER, S.A.U.');
    });

    it('должна унифицировать европейские формы (S.R.L., B.V., GMBH)', () => {
      expect(normalizeManufacturerName('WIDMANN S.R.L.')).toBe('WIDMANN, S.R.L.');
      expect(normalizeManufacturerName('TREVIDEA SRL')).toBe('TREVIDEA, S.R.L.');
      expect(normalizeManufacturerName('PAVO SALES B.V')).toBe('PAVO SALES B.V.');
      expect(normalizeManufacturerName('PAVO SALES B.V.')).toBe('PAVO SALES B.V.');
      expect(normalizeManufacturerName('FISSLER GMBH')).toBe('FISSLER GMBH');
    });
  });

  describe('Сохранение географических указателей и транскрипций в скобках', () => {
    it('не должна удалять географические страны в скобках (SPAIN, CHINA, INDIA)', () => {
      expect(normalizeManufacturerName('EATON INDUSTRIES (SPAIN), S.L.')).toBe('EATON INDUSTRIES (SPAIN), S.L.');
      expect(normalizeManufacturerName('UNI-TREND TECHNOLOGY (CHINA) CO., LTD.')).toBe('UNI-TREND TECHNOLOGY (CHINA) CO., LTD.');
      expect(normalizeManufacturerName('NEEDLE INDUSTRIES (INDIA) PRIVATE LIMITED')).toBe('NEEDLE INDUSTRIES (INDIA) PRIVATE LIMITED');
    });

    it('не должна удалять латинскую транскрипцию японских и иностранных названий в скобках', () => {
      expect(normalizeManufacturerName('ゼブラ(ZEBRA)')).toBe('ゼブラ(ZEBRA)');
      expect(normalizeManufacturerName('リーデル(RIEDEL)')).toBe('リーデル(RIEDEL)');
    });
  });

  describe('Очистка пробелов и обработка граничных значений', () => {
    it('должна удалять лишние пробелы по краям и внутри строки', () => {
      expect(normalizeManufacturerName('  cofan   ')).toBe('COFAN');
      expect(normalizeManufacturerName('ALFA    DYSER   S.L')).toBe('ALFA DYSER, S.L.');
    });

    it('должна возвращать null для пустых значений', () => {
      expect(normalizeManufacturerName(null)).toBeNull();
      expect(normalizeManufacturerName(undefined)).toBeNull();
      expect(normalizeManufacturerName('')).toBeNull();
      expect(normalizeManufacturerName('   ')).toBeNull();
    });
  });
});
