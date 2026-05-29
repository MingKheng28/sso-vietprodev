import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { DbManagerModule } from './db-manager/db-manager.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectIntegrationsModule } from './project-integrations/project-integrations.module';
import { OidcModule } from './oidc/oidc.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'client_secret'] } }),
    AppConfigModule,
    ScheduleModule.forRoot(),
    PrometheusModule.register({ path: '/metrics' }),
    DatabaseModule,
    DbManagerModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ProjectIntegrationsModule,
    OidcModule,
    AdminModule,
    HealthModule,
    SchedulerModule,
  ],
})
export class AppModule {}
