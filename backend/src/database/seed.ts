import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────
// Seed script — creates default users for all roles
// Run: npm run seed
// ─────────────────────────────────────────────────────────────

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'lk_db',
  username: process.env.DATABASE_USER || 'lk_user',
  password: process.env.DATABASE_PASSWORD || 'lk_pass',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Запуск seed...');

  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository('users');

  const defaultPassword = await bcrypt.hash('Password123!', 12);

  const users = [
    {
      email: 'techadmin@lk.local',
      password: defaultPassword,
      firstName: 'Техник',
      lastName: 'Администраторов',
      organization: 'Администрация',
      position: 'Системный администратор',
      phone: '+7 999 000-00-01',
      role: 'tech_admin',
      status: 'active',
      emailVerified: true,
    },
    {
      email: 'admin@lk.local',
      password: defaultPassword,
      firstName: 'Главный',
      lastName: 'Администраторов',
      organization: 'Администрация',
      position: 'Администратор',
      phone: '+7 999 000-00-02',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
    {
      email: 'seniormanager@lk.local',
      password: defaultPassword,
      firstName: 'Старший',
      lastName: 'Менеджеров',
      organization: 'Отдел управления',
      position: 'Старший менеджер',
      phone: '+7 999 000-00-03',
      role: 'senior_manager',
      status: 'active',
      emailVerified: true,
    },
    {
      email: 'manager@lk.local',
      password: defaultPassword,
      firstName: 'Пётр',
      lastName: 'Менеджеров',
      organization: 'Отдел управления',
      position: 'Менеджер проектов',
      phone: '+7 999 000-00-04',
      role: 'manager',
      status: 'active',
      emailVerified: true,
    },
    {
      email: 'client@lk.local',
      password: defaultPassword,
      firstName: 'Иван',
      lastName: 'Клиентов',
      organization: 'ООО Промтех',
      position: 'Главный инженер',
      phone: '+7 999 000-00-05',
      role: 'client',
      status: 'active',
      emailVerified: true,
    },
  ];

  for (const u of users) {
    const exists = await userRepo.findOne({ where: { email: u.email } });
    if (!exists) {
      await userRepo.save(userRepo.create(u));
      console.log(`  ✓ Создан пользователь: ${u.email} (${u.role})`);
    } else {
      console.log(`  — Пользователь уже существует: ${u.email}`);
    }
  }

  console.log('');
  console.log('✅ Seed завершён!');
  console.log('');
  console.log('Тестовые аккаунты (пароль: Password123!):');
  users.forEach(u => console.log(`  ${u.role.padEnd(16)} → ${u.email}`));
  console.log('');

  await AppDataSource.destroy();
}

seed().catch(err => {
  console.error('Ошибка seed:', err);
  process.exit(1);
});
