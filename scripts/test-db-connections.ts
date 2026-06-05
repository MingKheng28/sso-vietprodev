import 'dotenv/config';
import { Pool } from 'pg';
async function test(name: string, url?: string) { if (!url) return console.log(name, 'not configured'); const pool = new Pool({ connectionString: url, max: 1 }); try { await pool.query('SELECT 1'); console.log(name, 'ok'); } catch (e: any) { console.error(name, e.message); } finally { await pool.end(); } }
async function main() { await test('SSO_LOGIN_PRIMARY_URL', process.env.SSO_LOGIN_PRIMARY_URL); await test('PROJECT_A_DATABASE_URL', process.env.PROJECT_A_DATABASE_URL); await test('PROJECT_B_DATABASE_URL', process.env.PROJECT_B_DATABASE_URL); }
main();
