import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { EntityType, DocumentType } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      entityType: EntityType;
      entityId: number;
      documentType: DocumentType;
      notes?: string;
    },
  ) {
    return this.documentsService.upload(file, body);
  }

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.documentsService.findAll(entityType, documentType);
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.documentsService.findByEntity(entityType, entityId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findById(id);
  }

  @Get(':id/download')
  download(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.download(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}
