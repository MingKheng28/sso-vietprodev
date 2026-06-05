import { Injectable } from '@nestjs/common';
import { DbHealthService } from '../database/health/db-health.service';
@Injectable()
export class DbConnectionHealthService { constructor(private readonly health: DbHealthService) {} checkAll() { return this.health.checkAll(); } }
