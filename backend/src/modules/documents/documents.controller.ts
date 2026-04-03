import {
  Controller, Get, Post, Delete, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { DocumentsService, DocsQuery } from './documents.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guard';
import { UserRole } from '../users/user.entity';
import { DocumentCategory } from './document.entity';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список документов (каскадные фильтры по оборудованию и узлу)' })
  findAll(@Query() query: DocsQuery) {
    return this.svc.findAll(query);
  }

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить документ в S3' })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      name: string;
      category?: DocumentCategory;
      equipmentName?: string;
      nodeId?: string;
      projectId?: string;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.upload(file, { ...body, uploadedById: userId });
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Получить подписанную ссылку на скачивание (S3)' })
  getDownloadUrl(@Param('id') id: string) {
    return this.svc.getDownloadUrl(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER)
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
