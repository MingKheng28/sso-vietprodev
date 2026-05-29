import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { AuditCleanupScheduler } from './audit-cleanup.scheduler';
import { BackupCheckScheduler } from './backup-check.scheduler';
import { DbHealthScheduler } from './db-health.scheduler';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [BackupCheckScheduler, DbHealthScheduler, AuditCleanupScheduler],
})
export class SchedulerModule {}
