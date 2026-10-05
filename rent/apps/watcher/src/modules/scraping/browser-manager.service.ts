import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { config } from '../../config';

// Интерфейс статуса удаленного браузера
export interface BrowserStatusResponse {
  isRunning: boolean;
  status: 'running' | 'stopped' | 'not_found' | 'error';
  browserUrl: string;
  message: string;
}

// Интерфейс результата действия над браузером (запуск / остановка)
export interface BrowserActionResponse {
  success: boolean;
  status: 'started' | 'already_running' | 'stopped' | 'already_stopped' | 'error';
  browserUrl: string;
  message: string;
  error?: string;
}

// Интерфейс для безопасного парсинга состояния контейнера из Docker Engine API
interface DockerContainerState {
  Status?: string;
  Running?: boolean;
}

interface DockerInspectResponse {
  State?: DockerContainerState;
}

@Injectable()
export class BrowserManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserManagerService.name);
  // Таймер авто-остановки на случай, если пользователь забудет нажать кнопку подтверждения
  private autoStopTimer: NodeJS.Timeout | null = null;

  // Инициализация модуля: проверяем и обновляем конфигурацию профиля браузера
  onModuleInit(): void {
    this.ensureChromiumPreferences();
    this.fixProfilePermissions();
  }

  // Очистка таймеров при уничтожении модуля
  onModuleDestroy(): void {
    this.clearAutoStopTimer();
  }

  // Планирует авто-остановку контейнера через 15 минут
  private scheduleAutoStop(): void {
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
    }
    this.autoStopTimer = setTimeout(async () => {
      this.logger.log('Таймаут ожидания авторизации (15 минут) истек. Автоматически останавливаю браузер...');
      await this.stopBrowser();
    }, 15 * 60 * 1000);
    // Не удерживаем процесс Node.js активным
    this.autoStopTimer.unref();
  }

  // Сбрасывает таймер авто-остановки
  private clearAutoStopTimer(): void {
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
  }

  // Выполняет HTTP-запрос к локальному UNIX-сокету Docker Engine
  private makeDockerRequest(
    method: 'GET' | 'POST',
    path: string,
    body?: string
  ): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      // Проверяем наличие файла unix-сокета Docker в системе
      if (!fs.existsSync(config.DOCKER_SOCKET_PATH)) {
        return reject(
          new Error(`Docker socket не найден по пути ${config.DOCKER_SOCKET_PATH}`)
        );
      }

      const headers: Record<string, string | number> = {
        Host: 'localhost',
      };
      if (body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(body);
      }

      // Формируем запрос к сокету
      const req = http.request(
        {
          socketPath: config.DOCKER_SOCKET_PATH,
          path,
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString('utf8');
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode ?? 500,
              body: data,
            });
          });
        }
      );

      // Обработка сетевых ошибок сокета
      req.on('error', (err: Error) => {
        reject(err);
      });

      // Отправляем тело запроса, если передано
      if (body) {
        req.write(body);
      }

      // Завершаем отправку запроса
      req.end();
    });
  }

  // Выполняет команду внутри запущенного контейнера через Docker API
  private async execInContainer(container: string, cmd: string[]): Promise<void> {
    try {
      const createRes = await this.makeDockerRequest(
        'POST',
        `/containers/${container}/exec`,
        JSON.stringify({
          AttachStdout: false,
          AttachStderr: false,
          Cmd: cmd,
        })
      );
      if (createRes.statusCode !== 201) return;
      const parsed = JSON.parse(createRes.body) as { Id?: string };
      if (!parsed.Id) return;
      await this.makeDockerRequest(
        'POST',
        `/exec/${parsed.Id}/start`,
        JSON.stringify({ Detach: true, Tty: false })
      );
    } catch (e) {
      this.logger.warn(`Не удалось выполнить exec [${cmd.join(' ')}] в ${container}: ${e}`);
    }
  }

  // Получает текущее состояние контейнера визуального браузера
  async getStatus(): Promise<BrowserStatusResponse> {
    const container = config.VISUAL_BROWSER_CONTAINER;

    try {
      const response = await this.makeDockerRequest('GET', `/containers/${container}/json`);

      // Контейнер не существует в системе
      if (response.statusCode === 404) {
        return {
          isRunning: false,
          status: 'not_found',
          browserUrl: config.BROWSER_PUBLIC_URL,
          message: `Контейнер ${container} не найден в Docker Engine.`,
        };
      }

      // Разбираем JSON ответа Docker API без any
      const inspectData = JSON.parse(response.body) as unknown;
      const isRunning =
        typeof inspectData === 'object' &&
        inspectData !== null &&
        'State' in inspectData &&
        typeof (inspectData as DockerInspectResponse).State?.Running === 'boolean'
          ? (inspectData as DockerInspectResponse).State!.Running!
          : false;

      return {
        isRunning,
        status: isRunning ? 'running' : 'stopped',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: isRunning
          ? 'Удаленный виртуальный браузер активен и готов к работе.'
          : 'Удаленный виртуальный браузер остановлен.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Не удалось получить статус контейнера ${container}: ${errorMessage}`);
      return {
        isRunning: false,
        status: 'error',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: `Ошибка взаимодействия с Docker socket: ${errorMessage}`,
      };
    }
  }

  // Запускает контейнер виртуального браузера
  async startBrowser(): Promise<BrowserActionResponse> {
    const container = config.VISUAL_BROWSER_CONTAINER;
    this.logger.log(`Запрос на запуск удаленного браузера: ${container}`);

    // Сначала проверяем текущий статус
    const currentStatus = await this.getStatus();
    if (currentStatus.isRunning) {
      this.logger.log(`Контейнер ${container} уже запущен.`);
      this.scheduleAutoStop();
      return {
        success: true,
        status: 'already_running',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: 'Удаленный браузер уже запущен и доступен по ссылке.',
      };
    }

    try {
      // Перед стартом контейнера подготавливаем Preferences и выставляем права доступа
      this.ensureChromiumPreferences();
      this.fixProfilePermissions();

      const response = await this.makeDockerRequest('POST', `/containers/${container}/start`);

      // Коды 204 (успешно запущен) и 304 (уже запущен) означают готовность
      if (response.statusCode === 204 || response.statusCode === 304) {
        this.logger.log(`Контейнер ${container} успешно запущен.`);
        this.scheduleAutoStop();
        return {
          success: true,
          status: 'started',
          browserUrl: config.BROWSER_PUBLIC_URL,
          message: 'Удаленный браузер успешно запущен. Перейдите по ссылке для авторизации.',
        };
      }

      if (response.statusCode === 404) {
        return {
          success: false,
          status: 'error',
          browserUrl: config.BROWSER_PUBLIC_URL,
          message: `Контейнер ${container} не найден. Проверьте развертывание docker-compose.`,
          error: response.body,
        };
      }

      return {
        success: false,
        status: 'error',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: `Не удалось запустить контейнер (HTTP ${response.statusCode}).`,
        error: response.body,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Ошибка при запуске контейнера ${container}: ${errorMessage}`);
      return {
        success: false,
        status: 'error',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: `Сбой запуска удаленного браузера: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  // Останавливает контейнер виртуального браузера
  async stopBrowser(): Promise<BrowserActionResponse> {
    const container = config.VISUAL_BROWSER_CONTAINER;
    this.logger.log(`Запрос на остановку удаленного браузера: ${container}`);
    this.clearAutoStopTimer();

    // Проверяем текущий статус
    const currentStatus = await this.getStatus();
    if (!currentStatus.isRunning) {
      this.logger.log(`Контейнер ${container} уже остановлен.`);
      this.ensureChromiumPreferences();
      this.fixProfilePermissions();
      return {
        success: true,
        status: 'already_stopped',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: 'Удаленный браузер уже остановлен.',
      };
    }

    try {
      // 1. Сначала отправляем мягкий сигнал завершения Chromium, чтобы он успел сбросить куки и сессию на диск
      this.logger.log(`Отправка SIGTERM процессу Chromium внутри ${container}...`);
      await this.execInContainer(container, ['pkill', '-TERM', '-f', 'chromium']);
      // Даем 2 секунды на сброс сессии в базу данных SQLite
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Отправляем команду на остановку контейнера с увеличенным таймаутом 15 секунд
      const response = await this.makeDockerRequest('POST', `/containers/${container}/stop?t=15`);

      if (response.statusCode === 204 || response.statusCode === 304) {
        this.logger.log(`Контейнер ${container} успешно остановлен.`);
        // После остановки контейнера обновляем параметры Preferences и права доступа к профилю
        this.ensureChromiumPreferences();
        this.fixProfilePermissions();

        return {
          success: true,
          status: 'stopped',
          browserUrl: config.BROWSER_PUBLIC_URL,
          message: 'Удаленный браузер успешно остановлен, профиль сессии сохранен и освобожден.',
        };
      }

      return {
        success: false,
        status: 'error',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: `Не удалось остановить контейнер (HTTP ${response.statusCode}).`,
        error: response.body,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Ошибка при остановке контейнера ${container}: ${errorMessage}`);
      return {
        success: false,
        status: 'error',
        browserUrl: config.BROWSER_PUBLIC_URL,
        message: `Сбой остановки удаленного браузера: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  // Настраивает Preferences Chromium для гарантированного сохранения сессии и предотвращения очистки session cookies
  ensureChromiumPreferences(): void {
    try {
      const profilePath = config.BROWSER_PROFILE_PATH;
      if (!profilePath) return;

      const defaultDir = path.join(profilePath, 'Default');
      const prefPath = path.join(defaultDir, 'Preferences');

      if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
      }

      let prefs: Record<string, unknown> = {};
      if (fs.existsSync(prefPath)) {
        try {
          prefs = JSON.parse(fs.readFileSync(prefPath, 'utf8'));
        } catch {
          prefs = {};
        }
      }

      // Гарантируем, что restore_on_startup = 1 ("Продолжить с того же места")
      // Это предотвращает удаление неперсистентных session cookies при перезапусках браузера
      const currentSession = prefs.session && typeof prefs.session === 'object'
        ? (prefs.session as Record<string, unknown>)
        : {};
      prefs.session = {
        ...currentSession,
        restore_on_startup: 1,
      };

      // Предотвращаем появление плашки "Restore pages? Chromium didn't shut down correctly"
      const currentProfile = prefs.profile && typeof prefs.profile === 'object'
        ? (prefs.profile as Record<string, unknown>)
        : {};
      prefs.profile = {
        ...currentProfile,
        exit_type: 'Normal',
        exited_cleanly: true,
      };

      fs.writeFileSync(prefPath, JSON.stringify(prefs, null, 2), 'utf8');
      this.logger.log('Параметры Preferences Chromium успешно обновлены (restore_on_startup=1).');
    } catch (err) {
      this.logger.warn(`Не удалось обновить Preferences Chromium: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Исправляет права доступа на папку профиля браузера, чтобы и root, и пользователь контейнера могли работать с профилем
  fixProfilePermissions(): void {
    try {
      const dataDir = config.dataDir;
      const profileDir = path.join(dataDir, 'browser-profile');
      if (fs.existsSync(profileDir)) {
        // Рекурсивно выставляем права 777 на все файлы и папки профиля
        execSync(`chmod -R 777 "${profileDir}" 2>/dev/null || true`);
      }
    } catch {
      // Игнорируем ошибки прав, если нет прав root
    }
  }
}
