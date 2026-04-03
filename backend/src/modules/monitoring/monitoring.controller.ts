import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards/auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Monitoring (Техадмин)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TECH_ADMIN)
@Controller('api/monitoring')
export class MonitoringController {
  constructor(private svc: MonitoringService) {}

  @Get('system')
  @ApiOperation({ summary: 'Системные метрики: CPU, RAM, uptime' })
  getSystem() { return this.svc.getSystemMetrics(); }

  @Get('services')
  @ApiOperation({ summary: 'Состояние сервисов: БД, Redis, S3, API' })
  getServices() { return this.svc.getServicesStatus(); }

  @Get('app')
  @ApiOperation({ summary: 'Метрики приложения: ответы API, сессии, ошибки' })
  getApp() { return this.svc.getAppMetrics(); }

  @Get('logs')
  @ApiOperation({ summary: 'Логи приложения с фильтрацией по уровню и компоненту' })
  getLogs(
    @Query('level') level?: string,
    @Query('component') component?: string,
    @Query('limit') limit?: number,
  ) {
    return this.svc.getLogs(level, component, limit);
  }
}
