import { Injectable } from '@nestjs/common';
@Injectable()
export class PgbouncerHealthService { async check() { return { name: 'pgbouncer', status: process.env.PGBOUNCER_DATABASE_URL ? 'configured' : 'not_configured' }; } }
