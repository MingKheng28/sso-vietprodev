import { Injectable } from '@nestjs/common';
import { DbConnectionRouterService } from '../db-manager/db-connection-router.service';
@Injectable()
export class ProjectUserReaderService { constructor(private readonly router: DbConnectionRouterService) {} async findByEmail(appCode: string, table: string, emailColumn: string, email: string) { const result = await this.router.queryProject(appCode, `SELECT * FROM ${table} WHERE lower(${emailColumn})=lower($1) LIMIT 1`, [email]); return result.rows[0]; } }
