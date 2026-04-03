import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceStatus } from './maintenance.entity';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Maintenance (ТОиР)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/maintenance')
export class MaintenanceController {
  constructor(private svc: MaintenanceService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status?: MaintenanceStatus,
  ) {
    return this.svc.findAll(user, page, limit, status);
  }

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Создать заявку на ТО (клиент)' })
  create(
    @Body() body: { equipmentName: string; description: string; projectId?: string },
    @CurrentUser() user: any,
  ) {
    return this.svc.create(body, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Обновить статус заявки на ТО' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: MaintenanceStatus; comment?: string },
    @CurrentUser() user: any,
  ) {
    return this.svc.updateStatus(id, body.status, body.comment || '', user);
  }
}
