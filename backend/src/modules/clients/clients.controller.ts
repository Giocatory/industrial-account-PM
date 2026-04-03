import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards/auth.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER)
@Controller('api/clients')
export class ClientsController {
  constructor(private svc: ClientsService) {}

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ) {
    return this.svc.findAll(page, limit, search, sortBy, sortDir);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOneWithProjects(id);
  }
}
