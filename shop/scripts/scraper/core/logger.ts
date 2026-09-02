import fs from "fs";
import path from "path";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type ScraperStep =
  | "INIT"
  | "BROWSER_START"
  | "CAPTCHA_CHECK"
  | "CAPTCHA_WAIT"
  | "COLLECT_URLS"
  | "FETCH_ITEM"
  | "EXTRACT_JSONLD"
  | "EXTRACT_DOM"
  | "VALIDATE"
  | "DEDUPLICATION"
  | "SAVE_MASTER"
  | "SAVE_SNAPSHOT"
  | "LOCAL_BACKUP"
  | "FINISH";

// Цветовые коды ANSI для терминала
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bright: "\x1b[1m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

/**
 * Высокодетализированный структурированный логгер парсера
 * Записывает события одновременно в консоль и в отдельный файл сессии
 */
export class ScraperLogger {
  private logFilePath: string;
  private runId: string;
  private source: string;
  private writeStream: fs.WriteStream;

  constructor(runId: string, source: string) {
    this.runId = runId;
    this.source = source;

    // Создаем директорию для логов, если не существует
    const logsDir = path.resolve(process.cwd(), "logs", "scraper");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `run_${timestamp}_${source}_${runId.slice(0, 8)}.log`;
    this.logFilePath = path.join(logsDir, fileName);

    this.writeStream = fs.createWriteStream(this.logFilePath, { flags: "a", encoding: "utf8" });

    this.info("INIT", `Сессия парсинга инициализирована. Лог-файл: ${this.logFilePath}`);
  }

  /**
   * Возвращает абсолютный путь к файлу лога
   */
  public getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * Запись информационного сообщения
   */
  public info(step: ScraperStep, message: string, details?: Record<string, unknown>, itemUrl?: string): void {
    this.log("INFO", step, message, details, itemUrl);
  }

  /**
   * Запись предупреждения
   */
  public warn(step: ScraperStep, message: string, details?: Record<string, unknown>, itemUrl?: string): void {
    this.log("WARN", step, message, details, itemUrl);
  }

  /**
   * Запись ошибки со стеком
   */
  public error(step: ScraperStep, message: string, error?: unknown, itemUrl?: string): void {
    const details: Record<string, unknown> = {};
    if (error instanceof Error) {
      details.errorMessage = error.message;
      details.stack = error.stack;
    } else if (error) {
      details.errorRaw = String(error);
    }
    this.log("ERROR", step, message, details, itemUrl);
  }

  /**
   * Запись отладочного сообщения
   */
  public debug(step: ScraperStep, message: string, details?: Record<string, unknown>, itemUrl?: string): void {
    this.log("DEBUG", step, message, details, itemUrl);
  }

  /**
   * Основной метод форматирования и отправки лога
   */
  private log(
    level: LogLevel,
    step: ScraperStep,
    message: string,
    details?: Record<string, unknown>,
    itemUrl?: string
  ): void {
    const now = new Date().toISOString();
    const shortRunId = this.runId.slice(0, 8);

    // 1. Форматирование для текстового файла (без ANSI кодов)
    let fileLine = `[${now}] [${level.padEnd(5)}] [RUN:${shortRunId}] [${step.padEnd(14)}] ${message}`;
    if (itemUrl) {
      fileLine += ` | URL: ${itemUrl}`;
    }
    if (details && Object.keys(details).length > 0) {
      fileLine += ` | DETAILS: ${JSON.stringify(details)}`;
    }
    if (this.writeStream.writable) {
      this.writeStream.write(fileLine + "\n");
    }

    // 2. Форматирование для консоли (с цветами и акцентами)
    let colorLevel = COLORS.blue;
    if (level === "INFO") colorLevel = COLORS.cyan;
    if (level === "WARN") colorLevel = COLORS.yellow;
    if (level === "ERROR") colorLevel = COLORS.red;

    const prefix = `${COLORS.dim}[${now.slice(11, 19)}]${COLORS.reset} ${colorLevel}${level.padEnd(5)}${COLORS.reset} ${COLORS.magenta}[${step}]${COLORS.reset}`;
    let consoleMsg = `${prefix} ${message}`;

    if (itemUrl) {
      consoleMsg += ` ${COLORS.dim}(${itemUrl})${COLORS.reset}`;
    }

    if (level === "ERROR") {
      console.error(consoleMsg);
      if (details?.stack) {
        console.error(`${COLORS.red}${details.stack}${COLORS.reset}`);
      }
    } else if (level === "WARN") {
      console.warn(consoleMsg);
    } else {
      console.log(consoleMsg);
    }
  }

  /**
   * Закрытие потока записи при завершении
   */
  public close(): void {
    if (this.writeStream.writable) {
      this.writeStream.end();
    }
  }
}
