import { Controller, Get, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  /**
   * Проверяет существование бренда в базе данных
   */
  @Get('check')
  async check(@Query('name') name: string) {
    if (!name) return { exists: false };
    const brand = await this.brandsService.findByName(name);
    return { name, exists: !!brand };
  }
}
