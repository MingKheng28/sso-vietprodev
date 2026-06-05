import { Injectable } from '@nestjs/common';
import { DbConnectionManagerService } from './db-connection-manager.service';
@Injectable()
export class DbConnectionRouterService { constructor(private readonly manager: DbConnectionManagerService) {} queryProject(appCode: string, sql: string, params?: any[]) { return this.manager.getProjectPool(appCode).query(sql, params); } }
