import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Document } from './document.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { S3Service } from './s3.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    MulterModule.register({ storage: memoryStorage() }),
    AuthModule,
  ],
  providers: [DocumentsService, S3Service],
  controllers: [DocumentsController],
  exports: [DocumentsService, S3Service],
})
export class DocumentsModule {}
