import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { PrivateLabelsService } from './private-labels.service';

@Controller('private-labels')
export class PrivateLabelsController {
  constructor(private readonly privateLabelsService: PrivateLabelsService) {}

  @Get('check')
  async check(
    @Query('brandName') brandName: string,
    @Query('manufacturerName') manufacturerName: string,
  ) {
    if (!brandName || !manufacturerName) {
      return { isPrivateLabel: false };
    }
    const status = await this.privateLabelsService.checkPrivateLabel(brandName, manufacturerName);
    return { brandName, manufacturerName, ...status };
  }

  @Post()
  async add(
    @Body('brandName') brandName: string,
    @Body('manufacturerName') manufacturerName: string,
  ) {
    if (!brandName || !manufacturerName) {
      return { error: 'brandName and manufacturerName are required' };
    }
    return this.privateLabelsService.addPrivateLabel(brandName, manufacturerName);
  }
}
