/**
 * Учёт ежемесячных фактур клиенту J2T Services Ltd.
 *
 * Команды:
 *   template --from <docx>                     — один раз собрать шаблон с плейсхолдерами из готового docx
 *   generate --number F-NNNN-ГГГГ --date ДД/ММ/ГГГГ [--force]
 *                                              — проверить номер/дату по реестру и собрать английский docx
 *   check [--year ГГГГ]                        — сверка: для каждого номера есть PDF из Taxfix и docx, нет пропусков
 *
 * Порядок работы (оригинал всегда один — из Taxfix):
 *   1) пользователь создаёт фактуру в Taxfix и присылает PDF;
 *   2) PDF кладётся в J2T/<год>/F-NNNN-ГГГГ_factura_taxfix_es.pdf;
 *   3) запускается generate — скрипт сверяет номер и дату и создаёт F-NNNN-ГГГГ_invoice_en.docx.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Корневая директория facturas_emitidas (на уровень выше папки scripts)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Папка клиента J2T, внутри — подпапки по годам
const CLIENT_DIR = path.join(ROOT, 'J2T');
// Путь к шаблону английского инвойса с плейсхолдерами {{NUMBER}}, {{DATE}}, {{PERIOD}}
const TEMPLATE_PATH = path.join(CLIENT_DIR, 'template_invoice_en.docx');

// Правильная налоговая оговорка для услуг B2B клиенту из ЕС (reverse charge)
export const VAT_NOTE =
  'Reverse charge — VAT to be accounted for by the recipient (Art. 196 Directive 2006/112/EC). ' +
  'Supply not subject to Spanish VAT (Art. 69 Spanish VAT Law 37/1992). ' +
  'English version of the original invoice {{NUMBER}} issued in Spanish.';

// Регулярка номера фактуры серии F: F-0010-2026
const NUMBER_RE = /^F-(\d{4})-(\d{4})$/;

/** Разбирает номер фактуры на порядковый номер и год. */
export function parseNumber(num: string): { seq: number; year: number } {
  // Проверяем формат номера строго по шаблону F-NNNN-ГГГГ
  const m = NUMBER_RE.exec(num);
  if (!m) throw new Error(`Неверный формат номера «${num}», ожидается F-NNNN-ГГГГ`);
  return { seq: Number(m[1]), year: Number(m[2]) };
}

/** Собирает номер фактуры из порядкового номера и года. */
export function formatNumber(seq: number, year: number): string {
  // Порядковый номер дополняем нулями до 4 цифр
  return `F-${String(seq).padStart(4, '0')}-${year}`;
}

/** Разбирает дату ДД/ММ/ГГГГ. */
export function parseDate(s: string): { d: number; m: number; y: number } {
  // Проверяем формат даты
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) throw new Error(`Неверный формат даты «${s}», ожидается ДД/ММ/ГГГГ`);
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  // Проверяем, что такая дата существует в календаре
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) throw new Error(`Несуществующая дата «${s}»`);
  return { d, m: mo, y };
}

/** Последний день месяца. */
export function lastDayOfMonth(y: number, m: number): number {
  // Нулевой день следующего месяца = последний день текущего
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Период оказания услуг за месяц даты фактуры: 01.10.2026-31.10.2026. */
export function periodForDate(y: number, m: number): string {
  // Месяц с ведущим нулём
  const mm = String(m).padStart(2, '0');
  return `01.${mm}.${y}-${lastDayOfMonth(y, m)}.${mm}.${y}`;
}

/** Порядковые номера фактур за год, найденные по файлам: pdf из Taxfix и docx. */
export function scanYear(year: number, dir = CLIENT_DIR): Map<number, { pdf: boolean; docx: boolean }> {
  const result = new Map<number, { pdf: boolean; docx: boolean }>();
  const yearDir = path.join(dir, String(year));
  // Если папки года ещё нет, фактур за этот год тоже нет
  if (!fs.existsSync(yearDir)) return result;
  for (const f of fs.readdirSync(yearDir)) {
    // Имена файлов: F-NNNN-ГГГГ_factura_taxfix_es.pdf или F-NNNN-ГГГГ_invoice_en.docx
    const m = /^F-(\d{4})-(\d{4})_(factura_taxfix_es\.pdf|invoice_en\.docx)$/.exec(f);
    if (!m || Number(m[2]) !== year) continue;
    const seq = Number(m[1]);
    const entry = result.get(seq) ?? { pdf: false, docx: false };
    // Отмечаем, какой из двух документов найден
    if (m[3].endsWith('.pdf')) entry.pdf = true;
    else entry.docx = true;
    result.set(seq, entry);
  }
  return result;
}

/** Ожидаемый следующий номер: максимальный номер за год + 1 (в новом году — 0001). */
export function expectedNextSeq(existing: Map<number, unknown>, excludeSeq?: number): number {
  // Номер, для которого уже лежит PDF, при проверке не учитываем
  const seqs = [...existing.keys()].filter((s) => s !== excludeSeq);
  return seqs.length ? Math.max(...seqs) + 1 : 1;
}

/** Экранирует спецсимволы XML. */
function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Обратное преобразование XML-сущностей. */
function xmlUnescape(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/**
 * Заменяет текст на уровне абзацев. Word часто режет текст на несколько run-ов
 * (например, «F-00» + «10» + «-» + «202» + «6»). Поэтому собираем весь текст абзаца,
 * делаем замену и записываем результат в первый <w:t>, остальные <w:t> очищаем.
 * Форматирование первого фрагмента сохраняется.
 */
export function replaceInParagraphs(xml: string, replacements: Array<[string | RegExp, string]>): string {
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (para) => {
    // Находим все текстовые узлы абзаца
    const tRe = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;
    const texts = [...para.matchAll(tRe)];
    if (!texts.length) return para;
    // Склеиваем полный текст абзаца
    const full = texts.map((t) => xmlUnescape(t[2])).join('');
    let replaced = full;
    for (const [from, to] of replacements) {
      // Строку заменяем во всех вхождениях, RegExp — через replace (функция, чтобы «$» в тексте не трактовался как шаблон)
      replaced = typeof from === 'string' ? replaced.split(from).join(to) : replaced.replace(from, () => to);
    }
    if (replaced === full) return para;
    // Первый <w:t> получает весь новый текст, остальные становятся пустыми
    let i = 0;
    return para.replace(tRe, (_m, open: string, _txt: string, close: string) => {
      const value = i++ === 0 ? xmlEscape(replaced) : '';
      // Гарантируем сохранение пробелов
      const openTag = open.includes('xml:space') ? open : open.replace('<w:t', '<w:t xml:space="preserve"');
      return `${openTag}${value}${close}`;
    });
  });
}

/** Распаковывает docx, применяет преобразование к word/document.xml и упаковывает в новый файл. */
function transformDocx(src: string, dst: string, fn: (xml: string) => string): void {
  // Временная папка для распаковки
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-'));
  try {
    // Распаковываем исходный docx (это zip-архив)
    execFileSync('unzip', ['-q', '-o', src, '-d', tmp]);
    const docPath = path.join(tmp, 'word', 'document.xml');
    // Применяем замены к XML документа
    fs.writeFileSync(docPath, fn(fs.readFileSync(docPath, 'utf8')));
    // Упаковываем обратно; -X убирает лишние атрибуты файлов
    if (fs.existsSync(dst)) fs.unlinkSync(dst);
    execFileSync('zip', ['-q', '-X', '-r', path.resolve(dst), '.'], { cwd: tmp });
  } finally {
    // Удаляем временную папку
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** Извлекает простой текст из docx (для контроля результата). */
export function docxText(file: string): string {
  // Читаем document.xml прямо из архива через unzip -p
  const xml = execFileSync('unzip', ['-p', file, 'word/document.xml']).toString('utf8');
  return [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map((p) => [...p[0].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((t) => xmlUnescape(t[1])).join(''))
    .filter(Boolean)
    .join('\n');
}

/** Разбор аргументов командной строки вида --key value. */
function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const next = argv[i + 1];
    // Флаг без значения (например --force) или пара ключ-значение
    if (next === undefined || next.startsWith('--')) out[a.slice(2)] = true;
    else out[a.slice(2)] = argv[++i];
  }
  return out;
}

/** Команда template: собирает шаблон из готового docx. */
function cmdTemplate(args: Record<string, string | boolean>): void {
  const from = String(args.from ?? '');
  if (!fs.existsSync(from)) throw new Error(`Файл не найден: ${from}`);
  // Номер и дата берутся из имени и содержимого исходника
  const text = docxText(from);
  const num = /F-\d{3,4}-\d{4}/.exec(text)?.[0];
  const date = /\d{2}\/\d{2}\/\d{4}/.exec(text)?.[0];
  const period = /\d{2}\.\d{2}\.\d{4}-\d{2}\.\d{2}\.\d{4}/.exec(text)?.[0];
  if (!num || !date || !period) throw new Error('Не удалось найти номер, дату или период в исходном docx');
  transformDocx(from, TEMPLATE_PATH, (xml) =>
    replaceInParagraphs(xml, [
      [num, '{{NUMBER}}'],
      [date, '{{DATE}}'],
      [period, '{{PERIOD}}'],
      // Заменяем неверную оговорку «exempt … art. 25» на правильную reverse charge
      [/Invoice exempt from VAT[^\n]*$/, VAT_NOTE],
    ]),
  );
  console.log(`Шаблон создан: ${TEMPLATE_PATH}\n---\n${docxText(TEMPLATE_PATH)}`);
}

/** Команда generate: проверяет номер/дату по реестру и создаёт английский docx. */
function cmdGenerate(args: Record<string, string | boolean>): void {
  const number = String(args.number ?? '');
  const dateStr = String(args.date ?? '');
  const { seq, year } = parseNumber(number);
  const date = parseDate(dateStr);
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Год в номере должен совпадать с годом даты
  if (date.y !== year) errors.push(`Год в номере (${year}) не совпадает с годом даты (${date.y})`);

  // 2. Номер должен идти следующим по порядку (без пропусков и повторов)
  const existing = scanYear(year);
  const expected = expectedNextSeq(existing, seq);
  const already = existing.get(seq);
  if (already?.docx && !args.force) errors.push(`Английский docx для ${number} уже существует (перезапись: --force)`);
  if (seq !== expected) errors.push(`Ожидался номер ${formatNumber(expected, year)}, получен ${number}`);

  // 3. Оригинал из Taxfix должен уже лежать в реестре
  const pdfName = `${number}_factura_taxfix_es.pdf`;
  if (!already?.pdf) errors.push(`Нет оригинала из Taxfix: ${path.join('J2T', String(year), pdfName)}`);

  // 4. Фактура выставляется в последний день месяца оказания услуг
  const last = lastDayOfMonth(date.y, date.m);
  if (date.d !== last) warnings.push(`Дата ${dateStr} — не последний день месяца (${last}). Период всё равно будет за этот месяц`);

  // 5. Шаблон должен существовать
  if (!fs.existsSync(TEMPLATE_PATH)) errors.push(`Нет шаблона ${TEMPLATE_PATH}. Сначала выполните: template --from <docx>`);

  for (const w of warnings) console.warn(`⚠️  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`❌ ${e}`);
    process.exit(1);
  }

  // Собираем docx из шаблона
  const period = periodForDate(date.y, date.m);
  const dst = path.join(CLIENT_DIR, String(year), `${number}_invoice_en.docx`);
  transformDocx(TEMPLATE_PATH, dst, (xml) =>
    replaceInParagraphs(xml, [
      ['{{NUMBER}}', number],
      ['{{DATE}}', dateStr],
      ['{{PERIOD}}', period],
    ]),
  );
  // Контроль: в результате не должно остаться плейсхолдеров
  const text = docxText(dst);
  if (text.includes('{{')) throw new Error('В результате остались незаменённые плейсхолдеры');
  console.log(`✅ Создан ${dst}\n   Номер: ${number} | Дата: ${dateStr} | Период: ${period}\n---\n${text}`);
}

/** Команда check: сверка реестра — у каждого номера есть PDF Taxfix и docx, нумерация без пропусков. */
function cmdCheck(args: Record<string, string | boolean>): void {
  const year = Number(args.year ?? new Date().getFullYear());
  const existing = scanYear(year);
  if (!existing.size) {
    console.log(`За ${year} год фактур нет`);
    return;
  }
  const max = Math.max(...existing.keys());
  let problems = 0;
  // Проходим все номера от 1 до максимального, чтобы увидеть пропуски
  for (let s = 1; s <= max; s++) {
    const e = existing.get(s);
    const num = formatNumber(s, year);
    if (!e) {
      // Номера нет в репозитории (возможно, выставлен до начала учёта)
      console.log(`⚪ ${num}: нет файлов в реестре`);
      continue;
    }
    const pdf = e.pdf ? '✅ Taxfix PDF' : '❌ нет Taxfix PDF';
    const docx = e.docx ? '✅ EN docx' : '❌ нет EN docx';
    if (!e.pdf || !e.docx) problems++;
    console.log(`${e.pdf && e.docx ? '✅' : '❌'} ${num}: ${pdf} | ${docx}`);
  }
  // Ненулевой код выхода, если у каких-то фактур не хватает документов
  if (problems) process.exitCode = 2;
}

// Точка входа: запускаем команду, только если файл вызван напрямую (а не импортирован в тесте)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  try {
    if (cmd === 'template') cmdTemplate(args);
    else if (cmd === 'generate') cmdGenerate(args);
    else if (cmd === 'check') cmdCheck(args);
    else {
      console.log('Использование: invoice.ts template --from <docx> | generate --number F-NNNN-ГГГГ --date ДД/ММ/ГГГГ [--force] | check [--year ГГГГ]');
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ ${(e as Error).message}`);
    process.exit(1);
  }
}
