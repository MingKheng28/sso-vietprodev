import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DbHealthService } from '../database/health/db-health.service';
@Injectable()
export class DbHealthScheduler { private readonly logger = new Logger(DbHealthScheduler.name); constructor(private readonly health: DbHealthService) {} @Cron('*/30 * * * * *') async handle() { const result = await this.health.checkAll(); this.logger.log(JSON.stringify({ dbHealth: result })); } }
