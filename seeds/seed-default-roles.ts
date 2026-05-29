import { Pool } from 'pg';
export async function seedDefaultRoles(pool: Pool) { await pool.query("INSERT INTO roles(code,name) VALUES ('admin','Administrator'),('user','User') ON CONFLICT(code) DO NOTHING"); }
