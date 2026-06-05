import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../postgres/sso-pool.service';
import { ProjectPoolRegistry } from '../postgres/project-pool.registry';
import { MongoClientService } from '../mongo/mongo-client.service';
import { DependencyHealth } from './db-health.types';
@Injectable()
export class DbHealthService {
  constructor(private readonly sso: SsoPoolService, private readonly projects: ProjectPoolRegistry, private readonly mongo: MongoClientService) {}
  private async check(name: string, fn: () => Promise<unknown>): Promise<DependencyHealth> { const start = Date.now(); try { await fn(); return { name, status: 'up', latencyMs: Date.now() - start }; } catch (e: any) { return { name, status: 'down', latencyMs: Date.now() - start, error: e.message }; } }
  async checkAll() { const checks = [this.check('sso-postgres-ha-endpoint', () => this.sso.query('SELECT 1')), this.check('mongodb-audit', async () => (await this.mongo.db()).command({ ping: 1 }))]; for (const cfg of this.projects.listConfigs()) checks.push(this.check(`project-db:${cfg.appCode}`, () => this.projects.getPool(cfg.appCode).query('SELECT 1'))); return Promise.all(checks); }
}
