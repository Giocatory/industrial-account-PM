import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatMessage } from './chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private msgRepo: Repository<ChatMessage>,
  ) {}

  async saveMessage(data: {
    projectId?: string;
    senderId: string;
    recipientId?: string;
    content: string;
  }): Promise<ChatMessage> {
    const msg = this.msgRepo.create(data);
    return this.msgRepo.save(msg);
  }

  async getMessages(projectId: string, page = 1, limit = 50) {
    const take = Number(limit) || 50;
    const skip = (Number(page) - 1) * take;
    const [data, total] = await this.msgRepo.findAndCount({
      where: { projectId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      skip,
      take,
    });
    return { data, total };
  }

  async getDialogs(userId: string) {
    const all = await this.msgRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('m.senderId = :uid OR m.recipientId = :uid', { uid: userId })
      .andWhere('m.projectId IS NOT NULL')
      .orderBy('m.createdAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const dialogs: any[] = [];

    for (const msg of all) {
      if (!msg.projectId || seen.has(msg.projectId)) continue;
      seen.add(msg.projectId);

      const unread = await this.msgRepo.count({
        where: { projectId: msg.projectId, recipientId: userId, isRead: false },
      });

      dialogs.push({
        projectId: msg.projectId,
        lastMessage: msg.content,
        lastSender: `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim(),
        unread,
        createdAt: msg.createdAt,
      });
    }

    return dialogs;
  }

  async markRead(messageIds: string[]): Promise<void> {
    if (!messageIds.length) return;
    await this.msgRepo.update({ id: In(messageIds) }, { isRead: true });
  }

  async markProjectRead(projectId: string, userId: string): Promise<void> {
    await this.msgRepo.update(
      { projectId, recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  async unreadCount(userId: string): Promise<number> {
    return this.msgRepo.count({
      where: { recipientId: userId, isRead: false },
    });
  }
}
