import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppHealthService } from './app-health.service';
import { HaproxyHealthService } from './haproxy-health.service';
import { HealthController } from './health.controller';
import { PatroniHealthService } from './patroni-health.service';
import { PgbouncerHealthService } from './pgbouncer-health.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [AppHealthService, HaproxyHealthService, PgbouncerHealthService, PatroniHealthService],
  exports: [AppHealthService],
})
export class HealthModule {}
