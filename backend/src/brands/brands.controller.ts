import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('check')
  async check(@Query('name') name: string) {
    if (!name) return { isAnalyzed: false };
    const status = await this.brandsService.checkBrandAnalyzed(name);
    return { name, ...status };
  }
  
  @Post('mark-analyzed')
  async markAnalyzed(@Body('name') name: string) {
    if (!name) return { error: 'name is required' };
    return this.brandsService.markAsAnalyzed(name);
  }
}
