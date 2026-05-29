import { Injectable } from '@nestjs/common';
import { MongoClientService } from '../database/mongo/mongo-client.service';
import { MONGO_COLLECTIONS } from '../database/mongo/collections';
import { AuditLog } from './schemas/audit-log.schema';
@Injectable()
export class AuditRepository {
  constructor(private readonly mongo: MongoClientService) {}
  async insert(log: AuditLog) { const db = await this.mongo.db(); await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne(log); }
}
