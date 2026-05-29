import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { ClientsService } from '../clients/clients.service';
@Controller('admin/clients') @UseGuards(AdminGuard)
export class AdminClientsController { constructor(private readonly clients: ClientsService) {} @Get() list() { return this.clients.listActive(); } }
