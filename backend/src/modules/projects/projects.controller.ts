import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService, ProjectQuery } from './projects.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guard';
import { UserRole } from '../users/user.entity';
import { ProjectStatus } from './project.entity';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Список проектов (фильтрация по роли)' })
  findAll(@CurrentUser() user: any, @Query() query: ProjectQuery) {
    return this.projectsService.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER)
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.projectsService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.projectsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Изменить статус и прогресс проекта' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ProjectStatus; progress?: number },
    @CurrentUser() user: any,
  ) {
    return this.projectsService.updateStatus(id, body.status, body.progress ?? 0, user);
  }

  @Patch(':id/assign-manager')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER)
  @ApiOperation({ summary: 'Назначить менеджера на проект' })
  assignManager(
    @Param('id') id: string,
    @Body() body: { managerId: string },
    @CurrentUser() user: any,
  ) {
    return this.projectsService.assignManager(id, body.managerId, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.delete(id, user);
  }
}
