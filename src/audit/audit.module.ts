import { Module } from '@nestjs/common';
import { MongoModule } from '../database/mongo/mongo.module';
import { AuditLoggerService } from './audit-logger.service';
import { AuditRepository } from './audit.repository';

@Module({
  imports: [MongoModule],
  providers: [AuditLoggerService, AuditRepository],
  exports: [AuditLoggerService],
})
export class AuditModule {}
