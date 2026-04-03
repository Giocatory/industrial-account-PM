import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface UsersQuery {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: UserRole;
  search?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async findAll(query: UsersQuery) {
    const { page = 1, limit = 20, status, role, search, sortBy = 'createdAt', sortDir = 'DESC' } = query;
    const qb = this.repo.createQueryBuilder('u');

    if (status) qb.andWhere('u.status = :status', { status });
    if (role) qb.andWhere('u.role = :role', { role });
    if (search) {
      qb.andWhere(
        '(u.email ILIKE :s OR u.firstName ILIKE :s OR u.lastName ILIKE :s OR u.organization ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const allowedSort = ['createdAt', 'lastName', 'email', 'organization'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`u.${safeSort}`, sortDir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map(this.sanitize),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async approve(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (user.status !== UserStatus.PENDING)
      throw new BadRequestException('Пользователь не ожидает подтверждения');
    user.status = UserStatus.ACTIVE;
    return this.repo.save(user);
  }

  async reject(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.REJECTED;
    return this.repo.save(user);
  }

  async block(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.BLOCKED;
    return this.repo.save(user);
  }

  async changeRole(id: string, dto: ChangeRoleDto, requestor: User): Promise<User> {
    if (requestor.role !== UserRole.ADMIN)
      throw new ForbiddenException('Только администратор может менять роли');
    const user = await this.findOne(id);
    user.role = dto.role;
    return this.repo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new BadRequestException('Неверный текущий пароль');

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.repo.save(user);
    return { message: 'Пароль обновлён' };
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatar = avatarUrl;
    return this.repo.save(user);
  }

  private sanitize(user: User) {
    const { password, otpCode, otpExpiresAt, loginAttempts, lockedUntil, ...safe } = user;
    return safe;
  }
}
