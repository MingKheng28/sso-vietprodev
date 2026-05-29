import { Pool } from 'pg';
import * as argon2 from 'argon2';
export async function seedAdminUser(pool: Pool) { const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@sso.local'; const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!'; const hash = await argon2.hash(password, { type: argon2.argon2id }); await pool.query('INSERT INTO users(email,username,password_hash,status) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING', [email, 'admin', hash, 'active']); }
