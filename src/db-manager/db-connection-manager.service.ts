import { Injectable } from '@nestjs/common';
import { ProjectPoolRegistry } from '../database/postgres/project-pool.registry';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class DbConnectionManagerService {
  constructor(private readonly projects: ProjectPoolRegistry, private readonly sso: SsoPoolService) {}
  getProjectPool(appCode: string) { return this.projects.getPool(appCode); }
  getSsoWritePool() { return this.sso.getPool(); }
  getSsoReadPool() { return this.sso.getPool(); }
  listProjectConfigs() { return this.projects.listConfigs(); }
}
