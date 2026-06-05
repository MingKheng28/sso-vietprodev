import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbConfigService, ProjectDbConfig } from '../../config/db-config.service';
import { PostgresPoolService } from './postgres-pool.service';
@Injectable()
export class ProjectPoolRegistry implements OnModuleInit {
  private readonly configs = new Map<string, ProjectDbConfig>();
  constructor(private readonly dbConfig: DbConfigService, private readonly pools: PostgresPoolService) {}
  onModuleInit() { for (const cfg of this.dbConfig.getProjectConfigs()) this.configs.set(cfg.appCode, cfg); }
  getPool(appCode: string) { const cfg = this.configs.get(appCode); if (!cfg) throw new Error(`Unknown project appCode ${appCode}`); const url = process.env[cfg.connectionStringEnv]; if (!url) throw new Error(`Missing env ${cfg.connectionStringEnv}`); return this.pools.getOrCreate(`project:${appCode}`, url); }
  listConfigs() { return [...this.configs.values()].map((cfg) => ({ ...cfg, connectionStringConfigured: Boolean(process.env[cfg.connectionStringEnv]) })); }
}
