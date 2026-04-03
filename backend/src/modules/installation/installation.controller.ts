import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InstallationService } from './installation.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@ApiTags('Installation Schemas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/installation')
export class InstallationController {
  constructor(private svc: InstallationService) {}

  @Get()
  @ApiOperation({ summary: 'Список схем установки' })
  findAll(@Query('projectId') projectId?: string) {
    return this.svc.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Схема с интерактивными метками узлов' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
