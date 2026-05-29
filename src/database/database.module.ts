import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { DbHealthService } from './health/db-health.service';
import { MongoModule } from './mongo/mongo.module';
import { PostgresPoolService } from './postgres/postgres-pool.service';
import { ProjectPoolRegistry } from './postgres/project-pool.registry';
import { SsoPoolService } from './postgres/sso-pool.service';
import { TransactionService } from './postgres/transaction.service';

@Module({
  imports: [AppConfigModule, MongoModule],
  providers: [PostgresPoolService, ProjectPoolRegistry, SsoPoolService, TransactionService, DbHealthService],
  exports: [MongoModule, PostgresPoolService, ProjectPoolRegistry, SsoPoolService, TransactionService, DbHealthService],
})
export class DatabaseModule {}
