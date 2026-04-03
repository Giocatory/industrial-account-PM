import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentCategory } from './document.entity';
import { S3Service } from './s3.service';

export interface DocsQuery {
  page?: number;
  limit?: number;
  category?: DocumentCategory;
  equipmentName?: string;
  nodeId?: string;
  projectId?: string;
  search?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private repo: Repository<Document>,
    private s3: S3Service,
  ) {}

  async upload(
    file: Express.Multer.File,
    meta: {
      name: string;
      category?: DocumentCategory;
      equipmentName?: string;
      nodeId?: string;
      projectId?: string;
      uploadedById: string;
    },
  ): Promise<Document> {
    const { key, url } = await this.s3.upload(file);
    const doc = this.repo.create({
      ...meta,
      s3Key: key,
      s3Url: url,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
    return this.repo.save(doc);
  }

  async findAll(query: DocsQuery) {
    const { page = 1, limit = 20, category, equipmentName, nodeId, projectId, search } = query;
    const qb = this.repo.createQueryBuilder('d').leftJoinAndSelect('d.uploadedBy', 'u');

    if (category) qb.andWhere('d.category = :category', { category });
    if (equipmentName) qb.andWhere('d.equipmentName = :equipmentName', { equipmentName });
    if (nodeId) qb.andWhere('d.nodeId = :nodeId', { nodeId });
    if (projectId) qb.andWhere('d.projectId = :projectId', { projectId });
    if (search) qb.andWhere('d.name ILIKE :s', { s: `%${search}%` });

    qb.orderBy('d.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException();
    const url = await this.s3.getSignedDownloadUrl(doc.s3Key);
    return { url };
  }

  async delete(id: string): Promise<{ message: string }> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException();
    await this.s3.delete(doc.s3Key);
    await this.repo.delete(id);
    return { message: 'Документ удалён' };
  }
}
