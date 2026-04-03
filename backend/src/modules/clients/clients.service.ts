import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Project } from '../projects/project.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string, sortBy = 'createdAt', sortDir: 'asc'|'desc' = 'desc') {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.CLIENT });

    if (search) {
      qb.andWhere(
        '(u.email ILIKE :s OR u.firstName ILIKE :s OR u.lastName ILIKE :s OR u.organization ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const allowed = ['createdAt', 'lastName', 'organization'];
    const safe = allowed.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`u.${safe}`, sortDir === 'asc' ? 'ASC' : 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map(({ password, otpCode, otpExpiresAt, loginAttempts, lockedUntil, ...u }) => u),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOneWithProjects(id: string) {
    const user = await this.usersRepo.findOne({ where: { id, role: UserRole.CLIENT } });
    if (!user) throw new NotFoundException('Клиент не найден');

    const projects = await this.projectsRepo.find({
      where: { clientId: id },
      relations: ['manager'],
      order: { createdAt: 'DESC' },
    });

    const { password, otpCode, otpExpiresAt, loginAttempts, lockedUntil, ...safe } = user;
    return { ...safe, projects };
  }
}
