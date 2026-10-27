import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly healthcheckUrl = 'https://hc-ping.com/2c657cca-e25d-4875-8ab4-890d00740b51';

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Получить структурированный статус здоровья резервных копий всех баз данных
   * Читает статус-файлы, сформированные скриптами backup-all.sh и check-health.sh
   */
  getBackupHealth() {
    // Определяем пути к статусным JSON-файлам в каталоге backups
    const backupBaseDir = path.resolve(process.cwd(), 'backups');
    const healthFile = path.join(backupBaseDir, 'health_status.json');
    const lastBackupFile = path.join(backupBaseDir, 'last_backup_status.json');

    let healthData: any = null;
    let lastBackupData: any = null;

    // Читаем отчет скрипта check-health.sh
    if (fs.existsSync(healthFile)) {
      try {
        healthData = JSON.parse(fs.readFileSync(healthFile, 'utf8'));
      } catch (err) {
        this.logger.error('Не удалось прочитать health_status.json', err);
      }
    }

    // Читаем отчет скрипта backup-all.sh
    if (fs.existsSync(lastBackupFile)) {
      try {
        lastBackupData = JSON.parse(fs.readFileSync(lastBackupFile, 'utf8'));
      } catch (err) {
        this.logger.error('Не удалось прочитать last_backup_status.json', err);
      }
    }

    const isHealthy = healthData?.status === 'healthy';

    return {
      status: healthData?.status || 'unknown',
      checksPassed: healthData?.checksPassed ?? false,
      timestamp: healthData?.timestamp || new Date().toISOString(),
      health: healthData,
      lastBackup: lastBackupData,
      message: isHealthy
        ? 'Все резервные копии баз данных актуальны и проверены'
        : 'Обнаружены проблемы или предупреждения в резервных копиях баз данных',
    };
  }

  @Cron('*/10 * * * *')
  async handleCron() {
    try {
      await fetch(this.healthcheckUrl);
    } catch (error) {
      this.logger.error('Failed to send heartbeat to Healthchecks.io', error);
    }
  }
}

