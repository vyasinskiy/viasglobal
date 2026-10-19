import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('platforms')
  getPlatforms() {
    return this.productsService.getPlatforms();
  }

  @Delete('external-ids/:externalIdId')
  removeExternalId(@Param('externalIdId') externalIdId: string) {
    return this.productsService.removeExternalId(+externalIdId);
  }

  @Post('supplier-prices')
  addSupplierPrice(@Body() body: any) {
    return this.productsService.addSupplierPrice(body);
  }

  @Delete('supplier-prices/:priceId')
  removeSupplierPrice(@Param('priceId') priceId: string) {
    return this.productsService.removeSupplierPrice(+priceId);
  }

  @Post()
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('brand') brand?: string,
    @Query('category') category?: string,
  ) {
    return this.productsService.findAll(search, brand, category);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post(':id/external-ids')
  addExternalId(@Param('id') id: string, @Body() body: any) {
    return this.productsService.addExternalId(+id, body);
  }
}