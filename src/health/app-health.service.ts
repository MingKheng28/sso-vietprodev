import { Injectable } from '@nestjs/common';
import { DbHealthService } from '../database/health/db-health.service';
@Injectable()
export class AppHealthService { constructor(private readonly db: DbHealthService) {} live() { return { status: 'ok', timestamp: new Date().toISOString() }; } async ready() { const dependencies = await this.db.checkAll(); return { status: dependencies.every((d) => d.status === 'up') ? 'ok' : 'degraded', dependencies }; } }
