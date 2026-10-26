import http from 'node:http';
import { ApiRouter } from './routes.ts';

/**
 * Класс HTTP сервера для предоставления REST API сервиса SMS Gateway.
 */
export class HttpServer {
  private server: http.Server;
  private port: number;
  private router: ApiRouter;

  constructor(port: number, router: ApiRouter) {
    this.port = port;
    this.router = router;

    // Создаем экземпляр стандартного node:http сервера
    this.server = http.createServer((req, res) => {
      this.router.handleRequest(req, res).catch((err) => {
        console.error('[HttpServer] Необработанная ошибка в обработчике запроса:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }));
        }
      });
    });
  }

  /**
   * Запуск прослушивания входящих HTTP-подключений.
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`[HttpServer] 🚀 REST API сервер запущен на порту ${this.port} (0.0.0.0:${this.port})`);
        resolve();
      });

      this.server.once('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Остановка сервера.
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('[HttpServer] HTTP сервер успешно остановлен');
        resolve();
      });
    });
  }

  /**
   * Получение базового экземпляра сервера (для тестов).
   */
  public getRawServer(): http.Server {
    return this.server;
  }
}
