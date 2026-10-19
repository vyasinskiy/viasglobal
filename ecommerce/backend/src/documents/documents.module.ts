import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync('./uploads', { recursive: true });
          cb(null, './uploads');
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${randomUUID()}${extname(file.originalname)}`;
          cb(null, unique);
        },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
