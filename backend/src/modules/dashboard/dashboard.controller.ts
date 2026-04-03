import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, CurrentUser } from '../../common/guards/auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Метрики дашборда (по роли пользователя)' })
  getMetrics(@CurrentUser() user: any) {
    return this.svc.getMetrics(user);
  }
}
