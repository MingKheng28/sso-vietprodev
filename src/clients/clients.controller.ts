import { Controller, Get } from '@nestjs/common';
import { ClientsService } from './clients.service';
@Controller('apps')
export class ClientsController { constructor(private readonly clients: ClientsService) {} @Get() list() { return this.clients.listActive(); } }
