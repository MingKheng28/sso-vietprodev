import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { DatabaseModule } from '../database/database.module';
import { DbManagerModule } from '../db-manager/db-manager.module';
import { UsersModule } from '../users/users.module';
import { AdminClientsController } from './admin-clients.controller';
import { AdminDbController } from './admin-db.controller';
import { AdminHealthController } from './admin-health.controller';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [DatabaseModule, DbManagerModule, ClientsModule, UsersModule],
  controllers: [AdminDbController, AdminClientsController, AdminUsersController, AdminHealthController],
})
export class AdminModule {}
