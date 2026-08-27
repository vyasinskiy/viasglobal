import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly healthcheckUrl = 'https://hc-ping.com/2c657cca-e25d-4875-8ab4-890d00740b51';

  getHello(): string {
    return 'Hello World!';
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
