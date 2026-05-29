import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { AuditLog } from './schemas/audit-log.schema';
@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  constructor(private readonly repo: AuditRepository) {}
  async log(event: Omit<AuditLog, 'createdAt'>) { try { await this.repo.insert({ ...event, createdAt: new Date() }); } catch (e: any) { this.logger.error(`Audit write failed: ${e.message}`); } }
}
