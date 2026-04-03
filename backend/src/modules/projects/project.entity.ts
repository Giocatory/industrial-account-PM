import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ProjectStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  TESTING = 'testing',
  DELIVERY = 'delivery',
  COMPLETED = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() title: string;
  @Column({ nullable: true, type: 'text' }) description: string;
  @Column({ nullable: true }) equipmentName: string;
  @Column({ nullable: true }) equipmentModel: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.NEW })
  status: ProjectStatus;

  @Column({ type: 'int', default: 0 }) progress: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'managerId' })
  manager: User;

  @Column({ nullable: true }) managerId: string;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column() clientId: string;

  @Column({ nullable: true, type: 'timestamp' }) startDate: Date;
  @Column({ nullable: true, type: 'timestamp' }) endDate: Date;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
