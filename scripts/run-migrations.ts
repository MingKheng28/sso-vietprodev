import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
async function main() { const pool = new Pool({ connectionString: process.env.SSO_LOGIN_PRIMARY_URL }); const dir = join(process.cwd(), 'migrations'); const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort(); for (const file of files) { console.log('Running migration', file); await pool.query(readFileSync(join(dir, file), 'utf8')); } await pool.end(); }
main().catch((e) => { console.error(e); process.exit(1); });
