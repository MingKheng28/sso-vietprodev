import { Injectable } from '@nestjs/common';
import { SsoPoolService } from './sso-pool.service';
@Injectable()
export class TransactionService {
  constructor(private readonly sso: SsoPoolService) {}
  async inTransaction<T>(work: (client: any) => Promise<T>): Promise<T> { const client = await this.sso.getPool().connect(); try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); } }
}
