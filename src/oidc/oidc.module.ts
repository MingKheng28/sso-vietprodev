import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import { AppConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { OidcAdapterService } from './oidc-adapter.service';
import { OidcClaimsService } from './oidc-claims.service';
import { OidcInteractionsController } from './oidc-interactions.controller';
import { OidcProviderFactory } from './oidc-provider.factory';
import { OidcProviderService } from './oidc-provider.service';
import { OidcRoutesController } from './oidc-routes.controller';

@Module({
  imports: [AppConfigModule, DatabaseModule, UsersModule, AuthModule, AuditModule, ClientsModule],
  controllers: [OidcInteractionsController, OidcRoutesController],
  providers: [OidcProviderFactory, OidcProviderService, OidcAdapterService, OidcClaimsService],
  exports: [OidcProviderService],
})
export class OidcModule {}
