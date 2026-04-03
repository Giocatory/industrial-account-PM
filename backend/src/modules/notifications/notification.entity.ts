import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  REGISTRATION = 'registration',
  REQUEST = 'request',
  STATUS_CHANGE = 'status_change',
  DOCUMENT_UPLOAD = 'document_upload',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: NotificationType }) type: NotificationType;
  @Column() title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ default: false }) isRead: boolean;
  @Column({ nullable: true }) linkUrl: string;
  @Column() userId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'userId' }) user: User;
  @CreateDateColumn() createdAt: Date;
}
