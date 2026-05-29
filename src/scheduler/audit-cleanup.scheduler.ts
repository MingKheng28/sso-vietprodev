import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class AuditCleanupScheduler { private readonly logger = new Logger(AuditCleanupScheduler.name); @Cron('0 3 * * *') handle() { this.logger.log('Audit cleanup retention tick'); } }
