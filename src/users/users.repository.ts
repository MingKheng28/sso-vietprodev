import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: SsoPoolService) {}

  async findByEmail(email: string) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE lower(email)=lower($1) LIMIT 1',
      [email],
    );
    return result.rows[0];
  }

  async findByUsername(username: string) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE lower(username)=lower($1) LIMIT 1',
      [username],
    );
    return result.rows[0];
  }

  async findById(id: string) {
    const result = await this.db.query(
      'SELECT id,email,username,status,created_at,updated_at FROM users WHERE id=$1',
      [id],
    );
    return result.rows[0];
  }

  async create(data: { email: string; username: string; password_hash: string }) {
    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO users(id,email,username,password_hash,status)
       VALUES($1,$2,$3,$4,'active')
       RETURNING id,email,username,status,created_at,updated_at`,
      [id, data.email, data.username, data.password_hash],
    );
    return result.rows[0];
  }
}
