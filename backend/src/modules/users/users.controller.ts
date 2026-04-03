import {
  Controller, Get, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService, UsersQuery } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../common/guards/auth.guard';
import { UserRole } from './user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER)
  @ApiOperation({ summary: 'Список пользователей (с фильтрами, пагинацией)' })
  findAll(@Query() query: UsersQuery) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Текущий пользователь' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Подтвердить регистрацию' })
  approve(@Param('id') id: string) {
    return this.usersService.approve(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Отклонить регистрацию' })
  reject(@Param('id') id: string) {
    return this.usersService.reject(id);
  }

  @Post(':id/block')
  @Roles(UserRole.ADMIN)
  block(@Param('id') id: string) {
    return this.usersService.block(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Изменить роль пользователя' })
  changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() requestor: any,
  ) {
    return this.usersService.changeRole(id, dto, requestor);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Смена пароля текущего пользователя' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }
}
