import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard, CurrentUser } from '../../common/guards/auth.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('dialogs')
  @ApiOperation({ summary: 'Список диалогов текущего пользователя' })
  getDialogs(@CurrentUser('id') userId: string) {
    return this.chatService.getDialogs(userId);
  }

  @Get('messages/:projectId')
  @ApiOperation({ summary: 'История сообщений по проекту' })
  getMessages(
    @Param('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(projectId, page, limit);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Количество непрочитанных сообщений' })
  async unreadCount(@CurrentUser('id') userId: string) {
    const count = await this.chatService.unreadCount(userId);
    return { count };
  }

  @Post('messages/:projectId/read')
  @ApiOperation({ summary: 'Отметить все сообщения проекта прочитанными' })
  markProjectRead(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markProjectRead(projectId, userId);
  }
}
