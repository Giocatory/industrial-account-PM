import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum MaintenanceStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() equipmentName: string;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.NEW }) status: MaintenanceStatus;
  @Column({ nullable: true }) projectId: string;
  @Column() clientId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'clientId' }) client: User;
  @Column({ nullable: true }) managerId: string;
  @Column({ nullable: true, type: 'text' }) managerComment: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
