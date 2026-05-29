import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';
@Injectable()
export class PostgresPoolService implements OnModuleDestroy {
  private readonly pools = new Map<string, Pool>();
  getOrCreate(name: string, connectionString: string, options: PoolConfig = {}) {
    if (!this.pools.has(name)) this.pools.set(name, new Pool({ connectionString, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, ...options }));
    return this.pools.get(name)!;
  }
  async test(connectionString: string) { const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 }); try { const result = await pool.query('SELECT 1 AS ok'); return result.rows[0]; } finally { await pool.end(); } }
  async onModuleDestroy() { await Promise.all([...this.pools.values()].map((pool) => pool.end())); }
}
