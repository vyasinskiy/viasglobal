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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuppliersService } from './suppliers.service.js';
import { SupplierStatus, CommunicationType } from '@prisma/client';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(
    @Body()
    body: {
      name: string;
      website?: string;
      country?: string;
      email?: string;
      phone?: string;
      notes?: string;
    },
  ) {
    return this.suppliersService.create(body);
  }

  @Get()
  findAll(@Query('status') status?: SupplierStatus) {
    return this.suppliersService.findAll(status);
  }

  @Get('funnel')
  getFunnelStats() {
    return this.suppliersService.getFunnelStats();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      status: SupplierStatus;
      notes?: string;
      rejectionReason?: string;
    },
  ) {
    return this.suppliersService.updateStatus(id, body);
  }

  @Post(':id/contacts')
  addContact(
    @Param('id', ParseIntPipe) supplierId: number,
    @Body()
    body: {
      name: string;
      role?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
    },
  ) {
    return this.suppliersService.addContact(supplierId, body);
  }

  @Patch('contacts/:contactId')
  updateContact(
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body()
    body: {
      name?: string;
      role?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
    },
  ) {
    return this.suppliersService.updateContact(contactId, body);
  }

  @Delete('contacts/:contactId')
  deleteContact(@Param('contactId', ParseIntPipe) contactId: number) {
    return this.suppliersService.deleteContact(contactId);
  }

  @Post(':id/communications')
  addCommunication(
    @Param('id', ParseIntPipe) supplierId: number,
    @Body()
    body: {
      type: CommunicationType;
      summary: string;
      nextAction?: string;
      nextActionDate?: string;
    },
  ) {
    return this.suppliersService.addCommunication(supplierId, body);
  }
}