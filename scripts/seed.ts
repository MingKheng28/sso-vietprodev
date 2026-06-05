import 'dotenv/config';
import { Pool } from 'pg';
import { seedDefaultRoles } from '../seeds/seed-default-roles';
import { seedDemoClients } from '../seeds/seed-demo-clients';
import { seedAdminUser } from '../seeds/seed-admin-user';
async function main() { const pool = new Pool({ connectionString: process.env.SSO_LOGIN_PRIMARY_URL }); await seedDefaultRoles(pool); await seedDemoClients(pool); await seedAdminUser(pool); await pool.end(); console.log('Seed completed'); }
main().catch((e) => { console.error(e); process.exit(1); });
