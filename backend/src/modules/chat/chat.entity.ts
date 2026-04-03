import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) content: string;

  @Column({ type: 'varchar', nullable: true }) projectId: string | null;

  @Column({ type: 'varchar' }) senderId: string;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'varchar', nullable: true }) recipientId: string | null;

  @Column({ default: false }) isRead: boolean;

  @CreateDateColumn() createdAt: Date;
}
