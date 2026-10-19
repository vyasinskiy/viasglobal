import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() body: any) {
    return this.purchasesService.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.purchasesService.findAll(
      query.status,
      query.supplierId ? Number(query.supplierId) : undefined,
      query.fromDate,
      query.toDate,
    );
  }

  @Get('stats')
  getStats() {
    return this.purchasesService.getStats();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.purchasesService.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.purchasesService.updateStatus(id, body);
  }

  @Post(':id/items')
  addItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.purchasesService.addItem(id, body);
  }

  @Patch('items/:itemId')
  updateItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() body: any) {
    return this.purchasesService.updateItem(itemId, body);
  }

  @Patch('items/:itemId/receive')
  receiveItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: any,
  ) {
    return this.purchasesService.receiveItem(itemId, body.quantity);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.purchasesService.removeItem(itemId);
  }
}
