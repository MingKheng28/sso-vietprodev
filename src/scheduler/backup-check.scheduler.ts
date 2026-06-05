import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuditLoggerService } from '../audit/audit-logger.service';
import { AUDIT_EVENTS } from '../common/constants/audit-events.constant';
@Injectable()
export class BackupCheckScheduler { private readonly logger = new Logger(BackupCheckScheduler.name); constructor(private readonly audit: AuditLoggerService) {} @Cron('*/5 * * * *') async handle() { this.logger.log('Backup verification tick'); await this.audit.log({ eventType: AUDIT_EVENTS.DB_BACKUP_STARTED, status: 'info', metadata: { mode: 'verification-placeholder' } }); } }
