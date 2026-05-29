import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class UsersRepository {
  constructor(private readonly db: SsoPoolService) {}
  async findByEmail(email: string) { const result = await this.db.query('SELECT * FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]); return result.rows[0]; }
  async findById(id: string) { const result = await this.db.query('SELECT id,email,username,status,created_at,updated_at FROM users WHERE id=$1', [id]); return result.rows[0]; }
}
