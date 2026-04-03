import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/contacts')
export class ContactsController {
  constructor(private svc: ContactsService) {}

  @Get('team')
  getTeam() { return this.svc.getTeam(); }

  @Get('company')
  getCompany() { return this.svc.getCompanyContacts(); }
}
