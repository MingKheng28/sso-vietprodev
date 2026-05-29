import { Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { PostgresPoolService } from './postgres-pool.service';

@Injectable()
export class SsoPoolService {
  constructor(private readonly pools: PostgresPoolService) {}

  getPool() {
    const url = process.env.SSO_LOGIN_PRIMARY_URL;
    if (!url) throw new Error('Missing SSO_LOGIN_PRIMARY_URL');
    return this.pools.getOrCreate('sso:primary-ha-endpoint', url);
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]) {
    return this.getPool().query<T>(text, params);
  }
}
