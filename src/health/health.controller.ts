import { Controller, Get } from '@nestjs/common';
import { AppHealthService } from './app-health.service';
@Controller('health')
export class HealthController { constructor(private readonly health: AppHealthService) {} @Get('live') live() { return this.health.live(); } @Get('ready') ready() { return this.health.ready(); } @Get('dependencies') dependencies() { return this.health.ready(); } }
