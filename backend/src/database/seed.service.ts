import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../modules/users/user.entity';

const SEED_USERS = [
  {
    email: 'techadmin@lk.local',
    firstName: 'Техник',
    lastName: 'Администраторов',
    organization: 'Администрация',
    position: 'Системный администратор',
    phone: '+7 999 000-00-01',
    role: UserRole.TECH_ADMIN,
  },
  {
    email: 'admin@lk.local',
    firstName: 'Главный',
    lastName: 'Администраторов',
    organization: 'Администрация',
    position: 'Администратор',
    phone: '+7 999 000-00-02',
    role: UserRole.ADMIN,
  },
  {
    email: 'seniormanager@lk.local',
    firstName: 'Старший',
    lastName: 'Менеджеров',
    organization: 'Отдел управления',
    position: 'Старший менеджер',
    phone: '+7 999 000-00-03',
    role: UserRole.SENIOR_MANAGER,
  },
  {
    email: 'manager@lk.local',
    firstName: 'Пётр',
    lastName: 'Менеджеров',
    organization: 'Отдел управления',
    position: 'Менеджер проектов',
    phone: '+7 999 000-00-04',
    role: UserRole.MANAGER,
  },
  {
    email: 'client@lk.local',
    firstName: 'Иван',
    lastName: 'Клиентов',
    organization: 'ООО Промтех',
    position: 'Главный инженер',
    phone: '+7 999 000-00-05',
    role: UserRole.CLIENT,
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const password = await bcrypt.hash('Password123!', 12);
    let created = 0;

    for (const u of SEED_USERS) {
      const exists = await this.usersRepo.findOne({ where: { email: u.email } });
      if (!exists) {
        await this.usersRepo.save(
          this.usersRepo.create({
            ...u,
            password,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          }),
        );
        created++;
      }
    }

    if (created > 0) {
      this.logger.log(`✅ Seed: создано ${created} тестовых пользователей`);
      this.logger.log('   Пароль для всех: Password123!');
      SEED_USERS.forEach(u =>
        this.logger.log(`   ${u.role.padEnd(16)} → ${u.email}`),
      );
    } else {
      this.logger.log('Seed: тестовые пользователи уже существуют');
    }
  }
}
