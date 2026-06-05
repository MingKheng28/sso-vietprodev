import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DbConnectionHealthService } from './db-connection-health.service';
import { DbConnectionManagerService } from './db-connection-manager.service';
import { DbConnectionRouterService } from './db-connection-router.service';

@Module({
  imports: [DatabaseModule],
  providers: [DbConnectionManagerService, DbConnectionRouterService, DbConnectionHealthService],
  exports: [DbConnectionManagerService, DbConnectionRouterService, DbConnectionHealthService],
})
export class DbManagerModule {}
