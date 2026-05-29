import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { DbHealthService } from '../database/health/db-health.service';
@Controller('admin/db-health') @UseGuards(AdminGuard)
export class AdminHealthController { constructor(private readonly health: DbHealthService) {} @Get() check() { return this.health.checkAll(); } }
