import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export enum UserRole {
  TECH_ADMIN = 'tech_admin',
  ADMIN = 'admin',
  SENIOR_MANAGER = 'senior_manager',
  MANAGER = 'manager',
  CLIENT = 'client',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty()
  @Column()
  firstName: string;

  @ApiProperty()
  @Column()
  lastName: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  middleName: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  organization: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  position: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @ApiProperty({ enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @ApiProperty()
  @Column({ default: false })
  emailVerified: boolean;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  avatar: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  otpCode: string | null;

  @Exclude()
  @Column({ nullable: true, type: 'timestamp' })
  otpExpiresAt: Date | null;

  @Exclude()
  @Column({ default: 0 })
  loginAttempts: number;

  @Exclude()
  @Column({ nullable: true, type: 'timestamp' })
  lockedUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
