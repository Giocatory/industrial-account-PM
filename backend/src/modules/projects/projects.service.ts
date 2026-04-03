import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { User, UserRole } from '../users/user.entity';

export interface ProjectQuery {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  clientId?: string;
  managerId?: string;
  search?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,
  ) {}

  async findAll(user: User, query: ProjectQuery) {
    const { page = 1, limit = 20, status, clientId, managerId, search } = query;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.manager', 'manager')
      .leftJoinAndSelect('p.client', 'client');

    // Role-based scoping
    if (user.role === UserRole.CLIENT) {
      qb.andWhere('p.clientId = :uid', { uid: user.id });
    } else if (user.role === UserRole.MANAGER) {
      qb.andWhere('p.managerId = :uid', { uid: user.id });
    }
    // senior_manager, admin, tech_admin see all

    if (status) qb.andWhere('p.status = :status', { status });
    if (clientId) qb.andWhere('p.clientId = :clientId', { clientId });
    if (managerId) qb.andWhere('p.managerId = :managerId', { managerId });
    if (search) qb.andWhere('p.title ILIKE :s', { s: `%${search}%` });

    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.repo.findOne({
      where: { id },
      relations: ['manager', 'client'],
    });
    if (!project) throw new NotFoundException('Проект не найден');

    if (
      user.role === UserRole.CLIENT && project.clientId !== user.id ||
      user.role === UserRole.MANAGER && project.managerId !== user.id
    ) {
      throw new ForbiddenException('Нет доступа к проекту');
    }
    return project;
  }

  async create(dto: Partial<Project>, requestor: User): Promise<Project> {
    if (![UserRole.ADMIN, UserRole.SENIOR_MANAGER].includes(requestor.role)) {
      throw new ForbiddenException();
    }
    const project = this.repo.create(dto);
    return this.repo.save(project);
  }

  async update(id: string, dto: Partial<Project>, requestor: User): Promise<Project> {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException();

    if (requestor.role === UserRole.MANAGER && project.managerId !== requestor.id) {
      throw new ForbiddenException();
    }

    Object.assign(project, dto);
    return this.repo.save(project);
  }

  async assignManager(
    projectId: string, managerId: string, requestor: User,
  ): Promise<Project> {
    if (![UserRole.ADMIN, UserRole.SENIOR_MANAGER].includes(requestor.role)) {
      throw new ForbiddenException();
    }
    const project = await this.repo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException();
    project.managerId = managerId;
    return this.repo.save(project);
  }

  async updateStatus(
    id: string, status: ProjectStatus, progress: number, requestor: User,
  ): Promise<Project> {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException();

    const canUpdate =
      requestor.role === UserRole.MANAGER && project.managerId === requestor.id ||
      [UserRole.ADMIN, UserRole.SENIOR_MANAGER].includes(requestor.role);

    if (!canUpdate) throw new ForbiddenException();

    project.status = status;
    if (progress !== undefined) project.progress = progress;
    return this.repo.save(project);
  }

  async delete(id: string, requestor: User): Promise<{ message: string }> {
    if (![UserRole.ADMIN, UserRole.SENIOR_MANAGER].includes(requestor.role)) {
      throw new ForbiddenException();
    }
    await this.repo.delete(id);
    return { message: 'Проект удалён' };
  }
}
