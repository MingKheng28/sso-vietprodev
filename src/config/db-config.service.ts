import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
export interface ProjectDbConfig { appCode: string; provider: 'postgresql'; connectionStringEnv: string; userTable: string; userIdColumn: string; emailColumn: string; jsonProfileColumn?: string; }
@Injectable()
export class DbConfigService {
  private readonly configPath = join(process.cwd(), 'config', 'db-connections.example.json');
  readConfig() { return JSON.parse(readFileSync(this.configPath, 'utf8')); }
  getProjectConfigs(): ProjectDbConfig[] { return this.readConfig().projects ?? []; }
  getSsoConnectionString(): string { return process.env.SSO_LOGIN_PRIMARY_URL ?? ''; }
  getMongoUrl(): string { return process.env.MONGODB_AUDIT_URL ?? ''; }
  configExists(): boolean { return existsSync(this.configPath); }
}
