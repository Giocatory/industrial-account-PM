import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum DocumentCategory {
  PASSPORT = 'passport',
  INSTRUCTION = 'instruction',
  DRAWING = 'drawing',
  CONTRACT = 'contract',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ type: 'enum', enum: DocumentCategory, default: DocumentCategory.OTHER }) category: DocumentCategory;
  @Column({ nullable: true }) equipmentName: string;
  @Column({ nullable: true }) nodeId: string;
  @Column({ nullable: true }) projectId: string;
  @Column() s3Key: string;
  @Column() s3Url: string;
  @Column({ nullable: true }) fileSize: number;
  @Column({ nullable: true }) mimeType: string;
  @Column() uploadedById: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'uploadedById' }) uploadedBy: User;
  @CreateDateColumn() createdAt: Date;
}
