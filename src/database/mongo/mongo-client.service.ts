import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
@Injectable()
export class MongoClientService implements OnModuleDestroy {
  private client?: MongoClient;
  async getClient() { if (!this.client) { const url = process.env.MONGODB_AUDIT_URL; if (!url) throw new Error('Missing MONGODB_AUDIT_URL'); this.client = new MongoClient(url); await this.client.connect(); } return this.client; }
  async db(): Promise<Db> { const client = await this.getClient(); return client.db(process.env.MONGODB_AUDIT_DATABASE ?? 'sso_audit'); }
  async onModuleDestroy() { await this.client?.close(); }
}
