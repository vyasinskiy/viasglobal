import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return { status: 'ok', service: 'ecommerce-crm', timestamp: new Date().toISOString() };
  }
}