import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { validationSchema } from './validation.schema';
import { DbConfigService } from './db-config.service';
import { OidcConfigService } from './oidc-config.service';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema, validationOptions: { allowUnknown: true } })], providers: [DbConfigService, OidcConfigService], exports: [DbConfigService, OidcConfigService, ConfigModule] })
export class AppConfigModule {}
