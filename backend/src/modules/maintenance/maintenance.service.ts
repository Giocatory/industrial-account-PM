import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest, MaintenanceStatus } from './maintenance.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private repo: Repository<MaintenanceRequest>,
  ) {}

  async create(
    data: { equipmentName: string; description: string; projectId?: string },
    user: User,
  ): Promise<MaintenanceRequest> {
    const req = this.repo.create({ ...data, clientId: user.id });
    return this.repo.save(req);
  }

  async findAll(user: User, page = 1, limit = 20, status?: MaintenanceStatus) {
    const qb = this.repo.createQueryBuilder('m').leftJoinAndSelect('m.client', 'c');

    if (user.role === UserRole.CLIENT) qb.andWhere('m.clientId = :uid', { uid: user.id });
    else if (user.role === UserRole.MANAGER) qb.andWhere('m.managerId = :uid', { uid: user.id });

    if (status) qb.andWhere('m.status = :status', { status });

    qb.orderBy('m.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async updateStatus(
    id: string,
    status: MaintenanceStatus,
    comment: string,
    user: User,
  ): Promise<MaintenanceRequest> {
    if (![UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER].includes(user.role)) {
      throw new ForbiddenException();
    }
    const req = await this.repo.findOne({ where: { id } });
    if (!req) throw new NotFoundException();
    req.status = status;
    req.managerId = user.id;
    if (comment) req.managerComment = comment;
    return this.repo.save(req);
  }
}
