import { Injectable } from '@nestjs/common';
import { ProjectPoolRegistry } from '../database/postgres/project-pool.registry';
import { SsoPoolService } from '../database/postgres/sso-pool.service';

@Injectable()
export class DbConnectionManagerService {
  constructor(
    private readonly projects: ProjectPoolRegistry,
    private readonly sso: SsoPoolService,
  ) {}

  getProjectPool(appCode: string) {
    return this.projects.getPool(appCode);
  }

  getSsoWritePool() {
    return this.sso.getPool();
  }

  // TODO: Implement read replica routing
  // Read queries (SELECT only) should go to a read replica pool via HAProxy read port (5434).
  // Write queries (INSERT/UPDATE/DELETE) go to the primary pool via PgBouncer (6432).
  // Requires:
  //   1. Separate read pool configuration in SsoPoolService pointing to HAProxy :5434
  //   2. HAProxy config with a read replica backend (send to replicas only)
  //   3. Query classifier or explicit .queryRead() / .queryWrite() methods
  // Until then, both read and write go to the same pool (PgBouncer).
  getSsoReadPool() {
    return this.sso.getPool();
  }

  listProjectConfigs() {
    return this.projects.listConfigs();
  }
}
