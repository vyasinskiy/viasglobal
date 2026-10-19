import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() body: any) {
    return this.salesService.create(body);
  }

  @Get('stats')
  getStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.salesService.getStats(fromDate, toDate);
  }

  @Get()
  findAll(
    @Query('platformId') platformId?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.salesService.findAll(
      platformId ? +platformId : undefined,
      status,
      fromDate,
      toDate,
    );
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.salesService.update(id, body);
  }

  @Post(':id/items')
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.salesService.addItem(id, body);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: any,
  ) {
    return this.salesService.updateItem(itemId, body);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.salesService.removeItem(itemId);
  }
}