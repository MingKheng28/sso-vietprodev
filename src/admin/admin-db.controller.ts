import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { PostgresPoolService } from '../database/postgres/postgres-pool.service';
import { DbConnectionManagerService } from '../db-manager/db-connection-manager.service';
import { TestConnectionDto } from '../db-manager/dto/test-connection.dto';
@Controller('admin/db-connections') @UseGuards(AdminGuard)
export class AdminDbController { constructor(private readonly pools: PostgresPoolService, private readonly manager: DbConnectionManagerService) {} @Get() list() { return this.manager.listProjectConfigs(); } @Post('test') test(@Body() dto: TestConnectionDto) { return this.pools.test(dto.connectionString); } }
