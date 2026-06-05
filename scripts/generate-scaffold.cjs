const fs = require('fs');
const path = require('path');

const root = process.cwd();
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.replace(/^\n/, ''), 'utf8');
};

const json = (file, data) => write(file, JSON.stringify(data, null, 2) + '\n');

json('package.json', {
  name: 'sso-vietprodev',
  version: '0.1.0',
  private: true,
  description: 'Production-ready SSO Authorization Server using NestJS, oidc-provider, PostgreSQL HA endpoints and MongoDB audit logs.',
  license: 'UNLICENSED',
  scripts: {
    build: 'nest build',
    format: 'prettier --write "src/**/*.ts" "test/**/*.ts" "scripts/**/*.ts" "seeds/**/*.ts"',
    start: 'nest start',
    'start:dev': 'nest start --watch',
    'start:prod': 'node dist/main.js',
    lint: 'eslint "{src,test,scripts,seeds}/**/*.ts" --max-warnings=0',
    typecheck: 'tsc --noEmit',
    test: 'jest --passWithNoTests',
    'test:watch': 'jest --watch',
    'test:e2e': 'jest --config ./test/jest-e2e.json --passWithNoTests',
    'migration:run': 'ts-node -r tsconfig-paths/register scripts/run-migrations.ts',
    seed: 'ts-node -r tsconfig-paths/register scripts/seed.ts',
    'jwks:generate': 'ts-node -r tsconfig-paths/register scripts/generate-jwks.ts',
    'db:test': 'ts-node -r tsconfig-paths/register scripts/test-db-connections.ts',
    'smoke:oidc': 'ts-node -r tsconfig-paths/register scripts/smoke-test-oidc.ts'
  },
  dependencies: {
    '@nestjs/common': '^10.4.15',
    '@nestjs/config': '^3.3.0',
    '@nestjs/core': '^10.4.15',
    '@nestjs/platform-express': '^10.4.15',
    '@nestjs/schedule': '^4.1.2',
    '@nestjs/throttler': '^6.2.1',
    '@willsoto/nestjs-prometheus': '^6.0.2',
    argon2: '^0.41.1',
    'class-transformer': '^0.5.1',
    'class-validator': '^0.14.1',
    compression: '^1.7.5',
    'connect-pg-simple': '^10.0.0',
    'cookie-parser': '^1.4.7',
    csurf: '^1.11.0',
    dotenv: '^16.4.7',
    helmet: '^8.0.0',
    hbs: '^4.2.0',
    joi: '^17.13.3',
    jose: '^5.9.6',
    mongodb: '^6.11.0',
    'nestjs-pino': '^4.1.0',
    'node-cron': '^3.0.3',
    'oidc-provider': '^8.6.0',
    pg: '^8.13.1',
    'prom-client': '^15.1.3',
    'reflect-metadata': '^0.2.2',
    rxjs: '^7.8.1',
    uuid: '^11.0.3'
  },
  devDependencies: {
    '@nestjs/cli': '^10.4.8',
    '@nestjs/schematics': '^10.2.3',
    '@nestjs/testing': '^10.4.15',
    '@types/compression': '^1.7.5',
    '@types/connect-pg-simple': '^7.0.3',
    '@types/cookie-parser': '^1.4.8',
    '@types/csurf': '^1.11.5',
    '@types/express': '^5.0.0',
    '@types/hbs': '^4.0.4',
    '@types/jest': '^29.5.14',
    '@types/node': '^22.10.1',
    '@types/node-cron': '^3.0.11',
    '@types/oidc-provider': '^8.5.1',
    '@types/pg': '^8.11.10',
    '@types/supertest': '^6.0.2',
    '@typescript-eslint/eslint-plugin': '^8.18.0',
    '@typescript-eslint/parser': '^8.18.0',
    eslint: '^9.17.0',
    jest: '^29.7.0',
    prettier: '^3.4.2',
    'source-map-support': '^0.5.21',
    supertest: '^7.0.0',
    'ts-jest': '^29.2.5',
    'ts-loader': '^9.5.1',
    'ts-node': '^10.9.2',
    'tsconfig-paths': '^4.2.0',
    typescript: '^5.7.2'
  },
  jest: {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
  }
});

json('tsconfig.json', {
  compilerOptions: {
    module: 'commonjs',
    declaration: true,
    removeComments: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    allowSyntheticDefaultImports: true,
    target: 'ES2022',
    sourceMap: true,
    outDir: './dist',
    baseUrl: './',
    incremental: true,
    strict: true,
    skipLibCheck: true,
    noImplicitAny: false,
    strictBindCallApply: false,
    forceConsistentCasingInFileNames: true,
    noFallthroughCasesInSwitch: true,
    paths: { '@/*': ['src/*'] }
  }
});
json('tsconfig.build.json', { extends: './tsconfig.json', exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'] });
json('nest-cli.json', { '$schema': 'https://json.schemastore.org/nest-cli', collection: '@nestjs/schematics', sourceRoot: 'src' });

write('.gitignore', `node_modules\ndist\ncoverage\n.env\n.env.*\n!.env.example\nsecrets/*.json\n!secrets/.gitkeep\n!secrets/README.md\nnpm-debug.log*\n.DS_Store\n`);
write('.env.example', `NODE_ENV=development\nPORT=3000\nAPP_NAME=sso-vietprodev\nAPP_GLOBAL_PREFIX=\nCORS_ORIGINS=http://localhost:3001,http://localhost:3002\nSESSION_SECRET=change-me-session-secret-at-least-32-chars\nCOOKIE_SECURE=false\n\nSSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:6432/sso_login\nSSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:6432/sso_login\nPROJECT_A_DATABASE_URL=postgresql://project_user:password@localhost:5432/project_a\nPROJECT_B_DATABASE_URL=postgresql://project_user:password@localhost:5432/project_b\nMONGODB_AUDIT_URL=mongodb://localhost:27017/sso_audit\nMONGODB_AUDIT_DATABASE=sso_audit\n\nOIDC_ISSUER=http://localhost:3000\nOIDC_ACCESS_TOKEN_TTL=900\nOIDC_REFRESH_TOKEN_TTL=2592000\nOIDC_PRIVATE_JWK_PATH=./secrets/oidc-private.jwk.json\nOIDC_PUBLIC_JWKS_PATH=./secrets/oidc-jwks.json\nOIDC_COOKIE_KEYS=dev-cookie-key-1,dev-cookie-key-2\n\nADMIN_API_KEY=change-me-admin-api-key\nBACKUP_VERIFY_CRON=*/5 * * * *\nDB_HEALTH_CRON=*/30 * * * * *\nAUDIT_CLEANUP_CRON=0 3 * * *\nAUDIT_RETENTION_DAYS=365\nHAPROXY_STATS_URL=http://localhost:8404/stats;csv\nPATRONI_API_URL=http://localhost:8008\nPGBOUNCER_DATABASE_URL=postgresql://sso_app_user:password@localhost:6432/pgbouncer\n`);

write('config/db-connections.example.json', `{
  "ssoLogin": {
    "primary": {
      "name": "sso_login_ha_endpoint",
      "provider": "postgresql",
      "connectionStringEnv": "SSO_LOGIN_PRIMARY_URL",
      "role": "primary",
      "notes": "Production must point to PgBouncer/HAProxy endpoint, not a single PostgreSQL node."
    },
    "backup": {
      "name": "sso_login_backup_compat",
      "provider": "postgresql",
      "connectionStringEnv": "SSO_LOGIN_BACKUP_URL",
      "role": "backup",
      "notes": "Compatibility fallback for dev/test; production failover is handled by Patroni/HAProxy/PgBouncer."
    }
  },
  "projects": [
    {
      "appCode": "PROJECT_A",
      "provider": "postgresql",
      "connectionStringEnv": "PROJECT_A_DATABASE_URL",
      "userTable": "users",
      "userIdColumn": "id",
      "emailColumn": "email"
    },
    {
      "appCode": "PROJECT_B",
      "provider": "postgresql",
      "connectionStringEnv": "PROJECT_B_DATABASE_URL",
      "userTable": "users",
      "userIdColumn": "id",
      "emailColumn": "email",
      "jsonProfileColumn": "profile"
    }
  ],
  "audit": {
    "provider": "mongodb",
    "connectionStringEnv": "MONGODB_AUDIT_URL",
    "database": "sso_audit"
  }
}
`);
write('config/oidc.example.json', `{
  "issuerEnv": "OIDC_ISSUER",
  "routes": {
    "authorization": "/oauth/authorize",
    "token": "/oauth/token",
    "userinfo": "/oauth/userinfo",
    "jwks": "/oauth/jwks",
    "introspection": "/oauth/introspect",
    "revocation": "/oauth/revoke",
    "end_session": "/oauth/logout"
  },
  "features": {
    "devInteractions": false,
    "introspection": true,
    "revocation": true,
    "rpInitiatedLogout": true
  }
}
`);
write('config/clients.example.json', `[
  {
    "client_id": "project-a-web",
    "client_name": "Project A Web",
    "redirect_uris": ["http://localhost:3001/auth/callback"],
    "post_logout_redirect_uris": ["http://localhost:3001/"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email offline_access",
    "token_endpoint_auth_method": "none",
    "require_pkce": true
  },
  {
    "client_id": "project-b-web",
    "client_name": "Project B Web",
    "redirect_uris": ["http://localhost:3002/auth/callback"],
    "post_logout_redirect_uris": ["http://localhost:3002/"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email offline_access",
    "token_endpoint_auth_method": "none",
    "require_pkce": true
  }
]
`);
write('config/security.example.json', `{
  "passwordHash": "argon2id",
  "accessTokenTtlSeconds": 900,
  "refreshTokenTtlSeconds": 2592000,
  "loginRateLimit": { "ttlSeconds": 60, "limit": 10 },
  "adminRateLimit": { "ttlSeconds": 60, "limit": 60 },
  "cookie": { "httpOnly": true, "sameSite": "lax", "secureInProduction": true }
}
`);

write('src/main.ts', `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const port = Number(process.env.PORT ?? 3000);
  const globalPrefix = process.env.APP_GLOBAL_PREFIX ?? '';

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cookieParser(process.env.SESSION_SECRET));
  app.use(new SecurityHeadersMiddleware().use);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setBaseViewsDir(join(__dirname, 'oidc', 'views'));
  app.setViewEngine('hbs');
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/public' });

  const corsOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true });
  if (globalPrefix) app.setGlobalPrefix(globalPrefix);

  await app.listen(port);
}

bootstrap();
`);
write('src/app.module.ts', `import { Module } from '@nestjs/common';
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
`);

write('src/common/constants/audit-events.constant.ts', `export const AUDIT_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS', LOGIN_FAILED: 'LOGIN_FAILED', LOGOUT: 'LOGOUT', TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_VERIFY_FAILED: 'TOKEN_VERIFY_FAILED', PASSWORD_CHANGED: 'PASSWORD_CHANGED', ROLE_CHANGED: 'ROLE_CHANGED',
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED', DB_FAILOVER_STARTED: 'DB_FAILOVER_STARTED', DB_FAILOVER_SUCCESS: 'DB_FAILOVER_SUCCESS',
  DB_FAILOVER_FAILED: 'DB_FAILOVER_FAILED', DB_BACKUP_STARTED: 'DB_BACKUP_STARTED', DB_BACKUP_SUCCESS: 'DB_BACKUP_SUCCESS', DB_BACKUP_FAILED: 'DB_BACKUP_FAILED',
  ADMIN_ACTION: 'ADMIN_ACTION'
} as const;
export type AuditEventType = keyof typeof AUDIT_EVENTS;
`);
write('src/common/constants/oidc-scopes.constant.ts', `export const OIDC_SCOPES = ['openid', 'profile', 'email', 'offline_access'] as const;
`);
write('src/common/constants/security.constant.ts', `export const SENSITIVE_LOG_FIELDS = ['password', 'token', 'authorization', 'cookie', 'client_secret', 'connectionString'];
`);
write('src/common/decorators/current-user.decorator.ts', `import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user);
`);
write('src/common/decorators/request-id.decorator.ts', `import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const RequestId = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().requestId);
`);
write('src/common/filters/http-exception.filter.ts', `import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal server error';
    res.status(status).json({ statusCode: status, message, path: req.url, requestId: req.requestId, timestamp: new Date().toISOString() });
  }
}
`);
write('src/common/guards/admin.guard.ts', `import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || req.headers['x-admin-api-key'] !== expected) throw new UnauthorizedException('Admin API key required');
    return true;
  }
}
`);
write('src/common/guards/oidc-session.guard.ts', `import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
@Injectable()
export class OidcSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user && !req.session?.accountId) throw new UnauthorizedException('OIDC session required');
    return true;
  }
}
`);
write('src/common/interceptors/audit.interceptor.ts', `import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> { return next.handle(); }
}
`);
write('src/common/interceptors/request-id.interceptor.ts', `import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    req.requestId = req.headers['x-request-id'] ?? randomUUID();
    return next.handle();
  }
}
`);
write('src/common/middleware/security-headers.middleware.ts', `import { Injectable, NestMiddleware } from '@nestjs/common';
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    res.setHeader('X-Request-Id', req.requestId ?? req.headers['x-request-id'] ?? '');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  }
}
`);
write('src/common/middleware/request-context.middleware.ts', `import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) { req.requestId = req.headers['x-request-id'] ?? randomUUID(); next(); }
}
`);
write('src/common/utils/crypto.util.ts', `import { createHash, randomBytes } from 'crypto';
export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
`);
write('src/common/utils/env.util.ts', `export const requiredEnv = (name: string): string => { const value = process.env[name]; if (!value) throw new Error(\`Missing required env \${name}\`); return value; };
export const optionalEnv = (name: string, fallback = ''): string => process.env[name] ?? fallback;
`);
write('src/common/utils/pagination.util.ts', `export interface PageQuery { limit?: number; offset?: number; }
export const normalizePage = (query: PageQuery) => ({ limit: Math.min(Number(query.limit ?? 50), 200), offset: Math.max(Number(query.offset ?? 0), 0) });
`);

write('src/config/configuration.ts', `export default () => ({
  app: { name: process.env.APP_NAME ?? 'sso-vietprodev', port: Number(process.env.PORT ?? 3000), env: process.env.NODE_ENV ?? 'development' },
  oidc: { issuer: process.env.OIDC_ISSUER ?? 'http://localhost:3000', accessTokenTtl: Number(process.env.OIDC_ACCESS_TOKEN_TTL ?? 900), refreshTokenTtl: Number(process.env.OIDC_REFRESH_TOKEN_TTL ?? 2592000), privateJwkPath: process.env.OIDC_PRIVATE_JWK_PATH ?? './secrets/oidc-private.jwk.json', publicJwksPath: process.env.OIDC_PUBLIC_JWKS_PATH ?? './secrets/oidc-jwks.json' },
  database: { ssoPrimaryUrl: process.env.SSO_LOGIN_PRIMARY_URL, ssoBackupUrl: process.env.SSO_LOGIN_BACKUP_URL },
  audit: { mongoUrl: process.env.MONGODB_AUDIT_URL, database: process.env.MONGODB_AUDIT_DATABASE ?? 'sso_audit' },
});
`);
write('src/config/validation.schema.ts', `import Joi from 'joi';
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  SSO_LOGIN_PRIMARY_URL: Joi.string().uri().required(),
  MONGODB_AUDIT_URL: Joi.string().uri().required(),
  OIDC_ISSUER: Joi.string().uri().required(),
  SESSION_SECRET: Joi.string().min(32).required(),
});
`);
write('src/config/config.module.ts', `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { validationSchema } from './validation.schema';
import { DbConfigService } from './db-config.service';
import { OidcConfigService } from './oidc-config.service';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema, validationOptions: { allowUnknown: true } })], providers: [DbConfigService, OidcConfigService], exports: [DbConfigService, OidcConfigService, ConfigModule] })
export class AppConfigModule {}
`);
write('src/config/db-config.service.ts', `import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
export interface ProjectDbConfig { appCode: string; provider: 'postgresql'; connectionStringEnv: string; userTable: string; userIdColumn: string; emailColumn: string; jsonProfileColumn?: string; }
@Injectable()
export class DbConfigService {
  private readonly configPath = join(process.cwd(), 'config', 'db-connections.example.json');
  readConfig() { return JSON.parse(readFileSync(this.configPath, 'utf8')); }
  getProjectConfigs(): ProjectDbConfig[] { return this.readConfig().projects ?? []; }
  getSsoConnectionString(): string { return process.env.SSO_LOGIN_PRIMARY_URL ?? ''; }
  getMongoUrl(): string { return process.env.MONGODB_AUDIT_URL ?? ''; }
  configExists(): boolean { return existsSync(this.configPath); }
}
`);
write('src/config/oidc-config.service.ts', `import { Injectable } from '@nestjs/common';
@Injectable()
export class OidcConfigService {
  get issuer() { return process.env.OIDC_ISSUER ?? 'http://localhost:3000'; }
  get accessTokenTtl() { return Number(process.env.OIDC_ACCESS_TOKEN_TTL ?? 900); }
  get refreshTokenTtl() { return Number(process.env.OIDC_REFRESH_TOKEN_TTL ?? 2592000); }
  get cookieKeys() { return (process.env.OIDC_COOKIE_KEYS ?? 'dev-cookie-key').split(',').filter(Boolean); }
}
`);

write('src/database/database.module.ts', `import { Module } from '@nestjs/common';
import { MongoModule } from './mongo/mongo.module';
import { PostgresPoolService } from './postgres/postgres-pool.service';
import { ProjectPoolRegistry } from './postgres/project-pool.registry';
import { SsoPoolService } from './postgres/sso-pool.service';
import { TransactionService } from './postgres/transaction.service';
import { DbHealthService } from './health/db-health.service';
@Module({ imports: [MongoModule], providers: [PostgresPoolService, ProjectPoolRegistry, SsoPoolService, TransactionService, DbHealthService], exports: [MongoModule, PostgresPoolService, ProjectPoolRegistry, SsoPoolService, TransactionService, DbHealthService] })
export class DatabaseModule {}
`);
write('src/database/postgres/postgres-pool.service.ts', `import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';
@Injectable()
export class PostgresPoolService implements OnModuleDestroy {
  private readonly pools = new Map<string, Pool>();
  getOrCreate(name: string, connectionString: string, options: PoolConfig = {}) {
    if (!this.pools.has(name)) this.pools.set(name, new Pool({ connectionString, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, ...options }));
    return this.pools.get(name)!;
  }
  async test(connectionString: string) { const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 }); try { const result = await pool.query('SELECT 1 AS ok'); return result.rows[0]; } finally { await pool.end(); } }
  async onModuleDestroy() { await Promise.all([...this.pools.values()].map((pool) => pool.end())); }
}
`);
write('src/database/postgres/project-pool.registry.ts', `import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbConfigService, ProjectDbConfig } from '../../config/db-config.service';
import { PostgresPoolService } from './postgres-pool.service';
@Injectable()
export class ProjectPoolRegistry implements OnModuleInit {
  private readonly configs = new Map<string, ProjectDbConfig>();
  constructor(private readonly dbConfig: DbConfigService, private readonly pools: PostgresPoolService) {}
  onModuleInit() { for (const cfg of this.dbConfig.getProjectConfigs()) this.configs.set(cfg.appCode, cfg); }
  getPool(appCode: string) { const cfg = this.configs.get(appCode); if (!cfg) throw new Error(\`Unknown project appCode \${appCode}\`); const url = process.env[cfg.connectionStringEnv]; if (!url) throw new Error(\`Missing env \${cfg.connectionStringEnv}\`); return this.pools.getOrCreate(\`project:\${appCode}\`, url); }
  listConfigs() { return [...this.configs.values()].map((cfg) => ({ ...cfg, connectionStringConfigured: Boolean(process.env[cfg.connectionStringEnv]) })); }
}
`);
write('src/database/postgres/sso-pool.service.ts', `import { Injectable } from '@nestjs/common';
import { PostgresPoolService } from './postgres-pool.service';
@Injectable()
export class SsoPoolService {
  constructor(private readonly pools: PostgresPoolService) {}
  getPool() { const url = process.env.SSO_LOGIN_PRIMARY_URL; if (!url) throw new Error('Missing SSO_LOGIN_PRIMARY_URL'); return this.pools.getOrCreate('sso:primary-ha-endpoint', url); }
  async query<T = any>(text: string, params?: any[]) { return this.getPool().query<T>(text, params); }
}
`);
write('src/database/postgres/transaction.service.ts', `import { Injectable } from '@nestjs/common';
import { SsoPoolService } from './sso-pool.service';
@Injectable()
export class TransactionService {
  constructor(private readonly sso: SsoPoolService) {}
  async inTransaction<T>(work: (client: any) => Promise<T>): Promise<T> { const client = await this.sso.getPool().connect(); try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); } }
}
`);
write('src/database/mongo/mongo.module.ts', `import { Module } from '@nestjs/common';
import { MongoClientService } from './mongo-client.service';
@Module({ providers: [MongoClientService], exports: [MongoClientService] })
export class MongoModule {}
`);
write('src/database/mongo/mongo-client.service.ts', `import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
@Injectable()
export class MongoClientService implements OnModuleDestroy {
  private client?: MongoClient;
  async getClient() { if (!this.client) { const url = process.env.MONGODB_AUDIT_URL; if (!url) throw new Error('Missing MONGODB_AUDIT_URL'); this.client = new MongoClient(url); await this.client.connect(); } return this.client; }
  async db(): Promise<Db> { const client = await this.getClient(); return client.db(process.env.MONGODB_AUDIT_DATABASE ?? 'sso_audit'); }
  async onModuleDestroy() { await this.client?.close(); }
}
`);
write('src/database/mongo/collections.ts', `export const MONGO_COLLECTIONS = { AUDIT_LOGS: 'audit_logs' } as const;
`);
write('src/database/health/db-health.types.ts', `export interface DependencyHealth { name: string; status: 'up' | 'down'; latencyMs?: number; error?: string; }
`);
write('src/database/health/db-health.service.ts', `import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../postgres/sso-pool.service';
import { ProjectPoolRegistry } from '../postgres/project-pool.registry';
import { MongoClientService } from '../mongo/mongo-client.service';
import { DependencyHealth } from './db-health.types';
@Injectable()
export class DbHealthService {
  constructor(private readonly sso: SsoPoolService, private readonly projects: ProjectPoolRegistry, private readonly mongo: MongoClientService) {}
  private async check(name: string, fn: () => Promise<unknown>): Promise<DependencyHealth> { const start = Date.now(); try { await fn(); return { name, status: 'up', latencyMs: Date.now() - start }; } catch (e: any) { return { name, status: 'down', latencyMs: Date.now() - start, error: e.message }; } }
  async checkAll() { const checks = [this.check('sso-postgres-ha-endpoint', () => this.sso.query('SELECT 1')), this.check('mongodb-audit', async () => (await this.mongo.db()).command({ ping: 1 }))]; for (const cfg of this.projects.listConfigs()) checks.push(this.check(\`project-db:\${cfg.appCode}\`, () => this.projects.getPool(cfg.appCode).query('SELECT 1'))); return Promise.all(checks); }
}
`);

write('src/audit/audit.module.ts', `import { Module } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';
import { AuditRepository } from './audit.repository';
@Module({ providers: [AuditLoggerService, AuditRepository], exports: [AuditLoggerService] })
export class AuditModule {}
`);
write('src/audit/schemas/audit-log.schema.ts', `export interface AuditLog { eventType: string; userId?: string; clientApp?: string; ip?: string; userAgent?: string; status: 'success' | 'failed' | 'info'; metadata?: Record<string, unknown>; requestId?: string; createdAt: Date; }
`);
write('src/audit/audit.repository.ts', `import { Injectable } from '@nestjs/common';
import { MongoClientService } from '../database/mongo/mongo-client.service';
import { MONGO_COLLECTIONS } from '../database/mongo/collections';
import { AuditLog } from './schemas/audit-log.schema';
@Injectable()
export class AuditRepository {
  constructor(private readonly mongo: MongoClientService) {}
  async insert(log: AuditLog) { const db = await this.mongo.db(); await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne(log); }
}
`);
write('src/audit/audit-logger.service.ts', `import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { AuditLog } from './schemas/audit-log.schema';
@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  constructor(private readonly repo: AuditRepository) {}
  async log(event: Omit<AuditLog, 'createdAt'>) { try { await this.repo.insert({ ...event, createdAt: new Date() }); } catch (e: any) { this.logger.error(\`Audit write failed: \${e.message}\`); } }
}
`);

write('src/auth/auth.module.ts', `import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { UsersModule } from '../users/users.module';
@Module({ imports: [UsersModule], providers: [AuthService, PasswordService, SessionService], exports: [AuthService, PasswordService, SessionService] })
export class AuthModule {}
`);
write('src/auth/password.service.ts', `import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
@Injectable()
export class PasswordService { hash(password: string) { return argon2.hash(password, { type: argon2.argon2id }); } verify(hash: string, password: string) { return argon2.verify(hash, password); } }
`);
write('src/auth/auth.service.ts', `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly passwords: PasswordService) {}
  async validateUser(email: string, password: string) { const user = await this.users.findByEmail(email); if (!user || user.status !== 'active') throw new UnauthorizedException('Invalid credentials'); const ok = await this.passwords.verify(user.password_hash, password); if (!ok) throw new UnauthorizedException('Invalid credentials'); return user; }
}
`);
write('src/auth/session.service.ts', `import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
@Injectable()
export class SessionService { createSession(userId: string) { return { id: randomUUID(), userId, createdAt: new Date() }; } }
`);
write('src/auth/dto/login.dto.ts', `import { IsEmail, IsString, MinLength } from 'class-validator';
export class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
`);
write('src/auth/dto/change-password.dto.ts', `import { IsString, MinLength } from 'class-validator';
export class ChangePasswordDto { @IsString() currentPassword!: string; @IsString() @MinLength(12) newPassword!: string; }
`);

write('src/users/users.module.ts', `import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
@Module({ controllers: [UsersController], providers: [UsersService, UsersRepository], exports: [UsersService, UsersRepository] })
export class UsersModule {}
`);
write('src/users/users.repository.ts', `import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class UsersRepository {
  constructor(private readonly db: SsoPoolService) {}
  async findByEmail(email: string) { const result = await this.db.query('SELECT * FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]); return result.rows[0]; }
  async findById(id: string) { const result = await this.db.query('SELECT id,email,username,status,created_at,updated_at FROM users WHERE id=$1', [id]); return result.rows[0]; }
}
`);
write('src/users/users.service.ts', `import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
@Injectable()
export class UsersService { constructor(private readonly repo: UsersRepository) {} findByEmail(email: string) { return this.repo.findByEmail(email); } findById(id: string) { return this.repo.findById(id); } }
`);
write('src/users/users.controller.ts', `import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { UsersService } from './users.service';
@Controller('admin/users') @UseGuards(AdminGuard)
export class UsersController { constructor(private readonly users: UsersService) {} @Get(':id') findOne(@Param('id') id: string) { return this.users.findById(id); } }
`);
write('src/users/dto/create-user.dto.ts', `import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class CreateUserDto { @IsEmail() email!: string; @IsOptional() @IsString() username?: string; @IsString() @MinLength(12) password!: string; }
`);
write('src/users/dto/update-user.dto.ts', `import { IsOptional, IsString } from 'class-validator';
export class UpdateUserDto { @IsOptional() @IsString() username?: string; @IsOptional() @IsString() status?: string; }
`);

write('src/clients/clients.module.ts', `import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './clients.repository';
@Module({ controllers: [ClientsController], providers: [ClientsService, ClientsRepository], exports: [ClientsService, ClientsRepository] })
export class ClientsModule {}
`);
write('src/clients/clients.repository.ts', `import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class ClientsRepository {
  constructor(private readonly db: SsoPoolService) {}
  async findOidcClient(clientId: string) { const result = await this.db.query('SELECT * FROM clients WHERE client_id=$1 OR app_code=$1 LIMIT 1', [clientId]); return result.rows[0]; }
  async listActive() { const result = await this.db.query('SELECT id,app_code,name,status,created_at FROM clients WHERE status=$1 ORDER BY name', ['active']); return result.rows; }
}
`);
write('src/clients/clients.service.ts', `import { Injectable } from '@nestjs/common';
import { ClientsRepository } from './clients.repository';
@Injectable()
export class ClientsService { constructor(private readonly repo: ClientsRepository) {} findOidcClient(id: string) { return this.repo.findOidcClient(id); } listActive() { return this.repo.listActive(); } }
`);
write('src/clients/clients.controller.ts', `import { Controller, Get } from '@nestjs/common';
import { ClientsService } from './clients.service';
@Controller('apps')
export class ClientsController { constructor(private readonly clients: ClientsService) {} @Get() list() { return this.clients.listActive(); } }
`);
write('src/clients/dto/create-client.dto.ts', `import { IsArray, IsString } from 'class-validator';
export class CreateClientDto { @IsString() appCode!: string; @IsString() name!: string; @IsArray() redirectUris!: string[]; }
`);
write('src/clients/dto/update-client.dto.ts', `import { IsOptional, IsString } from 'class-validator';
export class UpdateClientDto { @IsOptional() @IsString() name?: string; @IsOptional() @IsString() status?: string; }
`);

write('src/db-manager/db-manager.module.ts', `import { Module } from '@nestjs/common';
import { DbConnectionManagerService } from './db-connection-manager.service';
import { DbConnectionRouterService } from './db-connection-router.service';
import { DbConnectionHealthService } from './db-connection-health.service';
@Module({ providers: [DbConnectionManagerService, DbConnectionRouterService, DbConnectionHealthService], exports: [DbConnectionManagerService, DbConnectionRouterService, DbConnectionHealthService] })
export class DbManagerModule {}
`);
write('src/db-manager/db-connection-manager.service.ts', `import { Injectable } from '@nestjs/common';
import { ProjectPoolRegistry } from '../database/postgres/project-pool.registry';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class DbConnectionManagerService {
  constructor(private readonly projects: ProjectPoolRegistry, private readonly sso: SsoPoolService) {}
  getProjectPool(appCode: string) { return this.projects.getPool(appCode); }
  getSsoWritePool() { return this.sso.getPool(); }
  getSsoReadPool() { return this.sso.getPool(); }
  listProjectConfigs() { return this.projects.listConfigs(); }
}
`);
write('src/db-manager/db-connection-router.service.ts', `import { Injectable } from '@nestjs/common';
import { DbConnectionManagerService } from './db-connection-manager.service';
@Injectable()
export class DbConnectionRouterService { constructor(private readonly manager: DbConnectionManagerService) {} queryProject(appCode: string, sql: string, params?: any[]) { return this.manager.getProjectPool(appCode).query(sql, params); } }
`);
write('src/db-manager/db-connection-health.service.ts', `import { Injectable } from '@nestjs/common';
import { DbHealthService } from '../database/health/db-health.service';
@Injectable()
export class DbConnectionHealthService { constructor(private readonly health: DbHealthService) {} checkAll() { return this.health.checkAll(); } }
`);
write('src/db-manager/dto/test-connection.dto.ts', `import { IsString, IsUrl } from 'class-validator';
export class TestConnectionDto { @IsString() name!: string; @IsUrl({ require_tld: false, require_protocol: true }) connectionString!: string; }
`);
write('src/db-manager/dto/project-db-config.dto.ts', `import { IsString } from 'class-validator';
export class ProjectDbConfigDto { @IsString() appCode!: string; @IsString() connectionStringEnv!: string; @IsString() userTable!: string; @IsString() userIdColumn!: string; @IsString() emailColumn!: string; }
`);

write('src/admin/admin.module.ts', `import { Module } from '@nestjs/common';
import { AdminDbController } from './admin-db.controller';
import { AdminClientsController } from './admin-clients.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminHealthController } from './admin-health.controller';
@Module({ controllers: [AdminDbController, AdminClientsController, AdminUsersController, AdminHealthController] })
export class AdminModule {}
`);
write('src/admin/admin-db.controller.ts', `import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { PostgresPoolService } from '../database/postgres/postgres-pool.service';
import { DbConnectionManagerService } from '../db-manager/db-connection-manager.service';
import { TestConnectionDto } from '../db-manager/dto/test-connection.dto';
@Controller('admin/db-connections') @UseGuards(AdminGuard)
export class AdminDbController { constructor(private readonly pools: PostgresPoolService, private readonly manager: DbConnectionManagerService) {} @Get() list() { return this.manager.listProjectConfigs(); } @Post('test') test(@Body() dto: TestConnectionDto) { return this.pools.test(dto.connectionString); } }
`);
write('src/admin/admin-health.controller.ts', `import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { DbHealthService } from '../database/health/db-health.service';
@Controller('admin/db-health') @UseGuards(AdminGuard)
export class AdminHealthController { constructor(private readonly health: DbHealthService) {} @Get() check() { return this.health.checkAll(); } }
`);
write('src/admin/admin-clients.controller.ts', `import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { ClientsService } from '../clients/clients.service';
@Controller('admin/clients') @UseGuards(AdminGuard)
export class AdminClientsController { constructor(private readonly clients: ClientsService) {} @Get() list() { return this.clients.listActive(); } }
`);
write('src/admin/admin-users.controller.ts', `import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { UsersService } from '../users/users.service';
@Controller('admin/users-v2') @UseGuards(AdminGuard)
export class AdminUsersController { constructor(private readonly users: UsersService) {} @Get(':id') get(@Param('id') id: string) { return this.users.findById(id); } }
`);

write('src/project-integrations/project-integrations.module.ts', `import { Module } from '@nestjs/common';
import { ProjectUserMappingService } from './project-user-mapping.service';
import { ProjectUserReaderService } from './project-user-reader.service';
@Module({ providers: [ProjectUserMappingService, ProjectUserReaderService], exports: [ProjectUserMappingService, ProjectUserReaderService] })
export class ProjectIntegrationsModule {}
`);
write('src/project-integrations/project-user-reader.service.ts', `import { Injectable } from '@nestjs/common';
import { DbConnectionRouterService } from '../db-manager/db-connection-router.service';
@Injectable()
export class ProjectUserReaderService { constructor(private readonly router: DbConnectionRouterService) {} async findByEmail(appCode: string, table: string, emailColumn: string, email: string) { const result = await this.router.queryProject(appCode, \`SELECT * FROM \${table} WHERE lower(\${emailColumn})=lower($1) LIMIT 1\`, [email]); return result.rows[0]; } }
`);
write('src/project-integrations/project-user-mapping.service.ts', `import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class ProjectUserMappingService { constructor(private readonly db: SsoPoolService) {} async listForUser(userId: string) { const result = await this.db.query('SELECT * FROM user_app_mappings WHERE sso_user_id=$1', [userId]); return result.rows; } }
`);
write('src/project-integrations/dto/create-user-mapping.dto.ts', `import { IsString, IsUUID } from 'class-validator';
export class CreateUserMappingDto { @IsUUID() ssoUserId!: string; @IsUUID() clientId!: string; @IsString() externalUserId!: string; }
`);
write('src/project-integrations/dto/project-user-query.dto.ts', `import { IsEmail, IsString } from 'class-validator';
export class ProjectUserQueryDto { @IsString() appCode!: string; @IsEmail() email!: string; }
`);

write('src/oidc/oidc.module.ts', `import { Module } from '@nestjs/common';
import { OidcProviderFactory } from './oidc-provider.factory';
import { OidcProviderService } from './oidc-provider.service';
import { OidcAdapterService } from './oidc-adapter.service';
import { OidcClaimsService } from './oidc-claims.service';
import { OidcInteractionsController } from './oidc-interactions.controller';
import { OidcRoutesController } from './oidc-routes.controller';
@Module({ controllers: [OidcInteractionsController, OidcRoutesController], providers: [OidcProviderFactory, OidcProviderService, OidcAdapterService, OidcClaimsService], exports: [OidcProviderService] })
export class OidcModule {}
`);
write('src/oidc/oidc-adapter.service.ts', `import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class OidcAdapterService {
  constructor(private readonly db: SsoPoolService) {}
  createAdapter(name: string) { const db = this.db; return class PgOidcAdapter { async upsert(id: string, payload: any, expiresIn: number) { await db.query('INSERT INTO oidc_grants(model,id,payload,expires_at) VALUES($1,$2,$3,NOW()+($4||\' seconds\')::interval) ON CONFLICT(model,id) DO UPDATE SET payload=$3, expires_at=NOW()+($4||\' seconds\')::interval', [name, id, payload, expiresIn]); } async find(id: string) { const r = await db.query('SELECT payload FROM oidc_grants WHERE model=$1 AND id=$2 AND (expires_at IS NULL OR expires_at>NOW())', [name, id]); return r.rows[0]?.payload; } async findByUserCode(userCode: string) { const r = await db.query('SELECT payload FROM oidc_grants WHERE model=$1 AND payload->>\'userCode\'=$2', [name, userCode]); return r.rows[0]?.payload; } async findByUid(uid: string) { const r = await db.query('SELECT payload FROM oidc_grants WHERE model=$1 AND payload->>\'uid\'=$2', [name, uid]); return r.rows[0]?.payload; } async destroy(id: string) { await db.query('DELETE FROM oidc_grants WHERE model=$1 AND id=$2', [name, id]); } async revokeByGrantId(grantId: string) { await db.query('DELETE FROM oidc_grants WHERE payload->>\'grantId\'=$1', [grantId]); } async consume(id: string) { await db.query('UPDATE oidc_grants SET payload=jsonb_set(payload, \'{consumed}\', to_jsonb(EXTRACT(EPOCH FROM NOW())::bigint)) WHERE model=$1 AND id=$2', [name, id]); } }; }
}
`);
write('src/oidc/oidc-claims.service.ts', `import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
@Injectable()
export class OidcClaimsService { constructor(private readonly users: UsersService) {} async claims(_: string, sub: string) { const user = await this.users.findById(sub); return { sub, email: user?.email, email_verified: true, preferred_username: user?.username ?? user?.email, name: user?.username ?? user?.email }; } }
`);
write('src/oidc/oidc-provider.factory.ts', `import { Injectable } from '@nestjs/common';
import Provider from 'oidc-provider';
import { OidcConfigService } from '../config/oidc-config.service';
import { OidcAdapterService } from './oidc-adapter.service';
import { OidcClaimsService } from './oidc-claims.service';
@Injectable()
export class OidcProviderFactory {
  constructor(private readonly config: OidcConfigService, private readonly adapter: OidcAdapterService, private readonly claims: OidcClaimsService) {}
  create() {
    return new Provider(this.config.issuer, {
      adapter: (name) => this.adapter.createAdapter(name) as any,
      clients: [],
      cookies: { keys: this.config.cookieKeys },
      claims: { openid: ['sub'], profile: ['name', 'preferred_username'], email: ['email', 'email_verified'] },
      async findAccount(ctx, sub) { return { accountId: sub, async claims(use, scope) { return ctx.container.resolve?.('claims') ?? { sub }; } } as any; },
      ttl: { AccessToken: this.config.accessTokenTtl, RefreshToken: this.config.refreshTokenTtl },
      features: { devInteractions: { enabled: false }, introspection: { enabled: true }, revocation: { enabled: true }, rpInitiatedLogout: { enabled: true } },
      routes: { authorization: '/oauth/authorize', token: '/oauth/token', userinfo: '/oauth/userinfo', jwks: '/oauth/jwks', introspection: '/oauth/introspect', revocation: '/oauth/revoke', end_session: '/oauth/logout' },
      interactions: { url: (_ctx, interaction) => \`/oidc/interaction/\${interaction.uid}\` },
    });
  }
}
`);
write('src/oidc/oidc-provider.service.ts', `import { Injectable, OnModuleInit } from '@nestjs/common';
import Provider from 'oidc-provider';
import { OidcProviderFactory } from './oidc-provider.factory';
@Injectable()
export class OidcProviderService implements OnModuleInit {
  private provider!: Provider;
  constructor(private readonly factory: OidcProviderFactory) {}
  onModuleInit() { this.provider = this.factory.create(); }
  get instance() { return this.provider; }
  callback() { return this.provider.callback(); }
}
`);
write('src/oidc/oidc-routes.controller.ts', `import { All, Controller, Req, Res } from '@nestjs/common';
import { OidcProviderService } from './oidc-provider.service';
@Controller()
export class OidcRoutesController { constructor(private readonly oidc: OidcProviderService) {} @All(['.well-known/openid-configuration', 'oauth/*']) handle(@Req() req: any, @Res() res: any) { return this.oidc.callback()(req, res); } }
`);
write('src/oidc/oidc-interactions.controller.ts', `import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuditLoggerService } from '../audit/audit-logger.service';
import { AUDIT_EVENTS } from '../common/constants/audit-events.constant';
import { OidcProviderService } from './oidc-provider.service';
@Controller('oidc/interaction')
export class OidcInteractionsController {
  constructor(private readonly oidc: OidcProviderService, private readonly auth: AuthService, private readonly audit: AuditLoggerService) {}
  @Get(':uid') async login(@Param('uid') uid: string, @Req() req: any, @Res() res: any) { const details = await this.oidc.instance.interactionDetails(req, res); return res.render('login', { uid, client: details.params.client_id, error: undefined }); }
  @Post(':uid/login') async submit(@Param('uid') uid: string, @Body() body: any, @Req() req: any, @Res() res: any) { try { const user = await this.auth.validateUser(body.email, body.password); await this.audit.log({ eventType: AUDIT_EVENTS.LOGIN_SUCCESS, userId: user.id, status: 'success', ip: req.ip, userAgent: req.headers['user-agent'], requestId: req.requestId }); const result = { login: { accountId: user.id, remember: Boolean(body.remember), ts: Math.floor(Date.now() / 1000) } }; return this.oidc.instance.interactionFinished(req, res, result, { mergeWithLastSubmission: false }); } catch (e) { await this.audit.log({ eventType: AUDIT_EVENTS.LOGIN_FAILED, status: 'failed', ip: req.ip, userAgent: req.headers['user-agent'], requestId: req.requestId }); return res.status(401).render('login', { uid, error: 'Email hoặc mật khẩu không hợp lệ' }); } }
}
`);
write('src/oidc/views/login.hbs', `<html><head><title>SSO Login</title><link rel="stylesheet" href="/public/css/login.css"></head><body><main class="card"><h1>Đăng nhập SSO</h1><p>Đăng nhập tập trung cho hệ sinh thái VietProDev.</p>{{#if error}}<div class="error">{{error}}</div>{{/if}}<form method="post" action="/oidc/interaction/{{uid}}/login"><label>Email<input name="email" type="email" required autocomplete="username"></label><label>Mật khẩu<input name="password" type="password" required autocomplete="current-password"></label><label class="inline"><input name="remember" type="checkbox" value="1"> Ghi nhớ phiên</label><button type="submit">Đăng nhập</button></form></main><script src="/public/js/login.js"></script></body></html>`);
write('src/oidc/views/consent.hbs', `<html><body><main class="card"><h1>Consent</h1><p>Ứng dụng yêu cầu quyền truy cập.</p></main></body></html>`);
write('src/oidc/views/logout.hbs', `<html><body><main class="card"><h1>Đăng xuất</h1><p>Phiên SSO đã kết thúc.</p></main></body></html>`);
write('src/oidc/views/error.hbs', `<html><body><main class="card"><h1>Lỗi SSO</h1><p>{{message}}</p></main></body></html>`);

write('src/health/health.module.ts', `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AppHealthService } from './app-health.service';
import { HaproxyHealthService } from './haproxy-health.service';
import { PgbouncerHealthService } from './pgbouncer-health.service';
import { PatroniHealthService } from './patroni-health.service';
@Module({ controllers: [HealthController], providers: [AppHealthService, HaproxyHealthService, PgbouncerHealthService, PatroniHealthService], exports: [AppHealthService] })
export class HealthModule {}
`);
write('src/health/app-health.service.ts', `import { Injectable } from '@nestjs/common';
import { DbHealthService } from '../database/health/db-health.service';
@Injectable()
export class AppHealthService { constructor(private readonly db: DbHealthService) {} live() { return { status: 'ok', timestamp: new Date().toISOString() }; } async ready() { const dependencies = await this.db.checkAll(); return { status: dependencies.every((d) => d.status === 'up') ? 'ok' : 'degraded', dependencies }; } }
`);
write('src/health/health.controller.ts', `import { Controller, Get } from '@nestjs/common';
import { AppHealthService } from './app-health.service';
@Controller('health')
export class HealthController { constructor(private readonly health: AppHealthService) {} @Get('live') live() { return this.health.live(); } @Get('ready') ready() { return this.health.ready(); } @Get('dependencies') dependencies() { return this.health.ready(); } }
`);
write('src/health/haproxy-health.service.ts', `import { Injectable } from '@nestjs/common';
@Injectable()
export class HaproxyHealthService { async check() { return { name: 'haproxy', status: process.env.HAPROXY_STATS_URL ? 'configured' : 'not_configured' }; } }
`);
write('src/health/pgbouncer-health.service.ts', `import { Injectable } from '@nestjs/common';
@Injectable()
export class PgbouncerHealthService { async check() { return { name: 'pgbouncer', status: process.env.PGBOUNCER_DATABASE_URL ? 'configured' : 'not_configured' }; } }
`);
write('src/health/patroni-health.service.ts', `import { Injectable } from '@nestjs/common';
@Injectable()
export class PatroniHealthService { async check() { return { name: 'patroni', status: process.env.PATRONI_API_URL ? 'configured' : 'not_configured' }; } }
`);

write('src/scheduler/scheduler.module.ts', `import { Module } from '@nestjs/common';
import { BackupCheckScheduler } from './backup-check.scheduler';
import { DbHealthScheduler } from './db-health.scheduler';
import { AuditCleanupScheduler } from './audit-cleanup.scheduler';
@Module({ providers: [BackupCheckScheduler, DbHealthScheduler, AuditCleanupScheduler] })
export class SchedulerModule {}
`);
write('src/scheduler/backup-check.scheduler.ts', `import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuditLoggerService } from '../audit/audit-logger.service';
import { AUDIT_EVENTS } from '../common/constants/audit-events.constant';
@Injectable()
export class BackupCheckScheduler { private readonly logger = new Logger(BackupCheckScheduler.name); constructor(private readonly audit: AuditLoggerService) {} @Cron('*/5 * * * *') async handle() { this.logger.log('Backup verification tick'); await this.audit.log({ eventType: AUDIT_EVENTS.DB_BACKUP_STARTED, status: 'info', metadata: { mode: 'verification-placeholder' } }); } }
`);
write('src/scheduler/db-health.scheduler.ts', `import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DbHealthService } from '../database/health/db-health.service';
@Injectable()
export class DbHealthScheduler { private readonly logger = new Logger(DbHealthScheduler.name); constructor(private readonly health: DbHealthService) {} @Cron('*/30 * * * * *') async handle() { const result = await this.health.checkAll(); this.logger.log(JSON.stringify({ dbHealth: result })); } }
`);
write('src/scheduler/audit-cleanup.scheduler.ts', `import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class AuditCleanupScheduler { private readonly logger = new Logger(AuditCleanupScheduler.name); @Cron('0 3 * * *') handle() { this.logger.log('Audit cleanup retention tick'); } }
`);

write('public/css/login.css', `body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,Arial,sans-serif;background:#0f172a;color:#0f172a}.card{width:min(420px,calc(100vw - 32px));background:#fff;border-radius:20px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.35)}h1{margin:0 0 8px}label{display:block;margin:16px 0 8px;font-weight:600}input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:12px}.inline{display:flex;gap:8px;align-items:center;font-weight:400}.inline input{width:auto}button{width:100%;border:0;border-radius:10px;padding:12px 16px;background:#2563eb;color:white;font-weight:700;cursor:pointer}.error{background:#fee2e2;color:#991b1b;padding:10px;border-radius:10px}`);
write('public/js/login.js', `document.documentElement.dataset.js = 'enabled';\n`);
write('public/assets/logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#2563eb"/><text x="60" y="70" font-size="38" text-anchor="middle" fill="white" font-family="Arial">SSO</text></svg>`);
write('public/assets/favicon.ico', '');

write('migrations/001_create_users.sql', `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);
write('migrations/002_create_clients.sql', `CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_code TEXT UNIQUE NOT NULL,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT,
  name TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  post_logout_redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  grant_types TEXT[] NOT NULL DEFAULT '{authorization_code,refresh_token}',
  response_types TEXT[] NOT NULL DEFAULT '{code}',
  scopes TEXT[] NOT NULL DEFAULT '{openid,profile,email}',
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
  require_pkce BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`);
write('migrations/003_create_project_db_connections.sql', `CREATE TABLE IF NOT EXISTS project_db_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_code TEXT NOT NULL REFERENCES clients(app_code),
  provider TEXT NOT NULL DEFAULT 'postgresql',
  connection_string_env TEXT NOT NULL,
  user_table TEXT NOT NULL DEFAULT 'users',
  user_id_column TEXT NOT NULL DEFAULT 'id',
  email_column TEXT NOT NULL DEFAULT 'email',
  json_profile_column TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_code)
);
CREATE TABLE IF NOT EXISTS user_app_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sso_user_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  external_user_id TEXT NOT NULL,
  external_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, external_user_id)
);
`);
write('migrations/004_create_roles_permissions.sql', `CREATE TABLE IF NOT EXISTS roles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS permissions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS user_roles (user_id UUID REFERENCES users(id), role_id UUID REFERENCES roles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id, role_id));
CREATE TABLE IF NOT EXISTS role_permissions (role_id UUID REFERENCES roles(id), permission_id UUID REFERENCES permissions(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(role_id, permission_id));
`);
write('migrations/005_create_sessions_tokens.sql', `CREATE TABLE IF NOT EXISTS sessions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id), user_agent TEXT, ip INET, expires_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS refresh_tokens (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id), token_hash TEXT NOT NULL UNIQUE, session_id UUID REFERENCES sessions(id), expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS oidc_grants (model TEXT NOT NULL, id TEXT NOT NULL, payload JSONB NOT NULL, expires_at TIMESTAMPTZ, consumed_at TIMESTAMPTZ, PRIMARY KEY(model,id));
CREATE INDEX IF NOT EXISTS idx_oidc_grants_expires_at ON oidc_grants(expires_at);
`);
write('migrations/006_create_failover_events.sql', `CREATE TABLE IF NOT EXISTS db_connections (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT UNIQUE NOT NULL, provider TEXT NOT NULL, role TEXT, connection_string_env TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS failover_events (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), event_type TEXT NOT NULL, old_primary TEXT, new_primary TEXT, reason TEXT, metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
`);

write('seeds/seed-default-roles.ts', `import { Pool } from 'pg';
export async function seedDefaultRoles(pool: Pool) { await pool.query("INSERT INTO roles(code,name) VALUES ('admin','Administrator'),('user','User') ON CONFLICT(code) DO NOTHING"); }
`);
write('seeds/seed-demo-clients.ts', `import { Pool } from 'pg';
export async function seedDemoClients(pool: Pool) { await pool.query(\`INSERT INTO clients(app_code,client_id,name,redirect_uris,post_logout_redirect_uris,scopes) VALUES
('PROJECT_A','project-a-web','Project A Web',ARRAY['http://localhost:3001/auth/callback'],ARRAY['http://localhost:3001/'],ARRAY['openid','profile','email','offline_access']),
('PROJECT_B','project-b-web','Project B Web',ARRAY['http://localhost:3002/auth/callback'],ARRAY['http://localhost:3002/'],ARRAY['openid','profile','email','offline_access']) ON CONFLICT(app_code) DO NOTHING\`); }
`);
write('seeds/seed-admin-user.ts', `import { Pool } from 'pg';
import * as argon2 from 'argon2';
export async function seedAdminUser(pool: Pool) { const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@sso.local'; const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!'; const hash = await argon2.hash(password, { type: argon2.argon2id }); await pool.query('INSERT INTO users(email,username,password_hash,status) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING', [email, 'admin', hash, 'active']); }
`);
write('scripts/run-migrations.ts', `import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
async function main() { const pool = new Pool({ connectionString: process.env.SSO_LOGIN_PRIMARY_URL }); const dir = join(process.cwd(), 'migrations'); const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort(); for (const file of files) { console.log('Running migration', file); await pool.query(readFileSync(join(dir, file), 'utf8')); } await pool.end(); }
main().catch((e) => { console.error(e); process.exit(1); });
`);
write('scripts/seed.ts', `import 'dotenv/config';
import { Pool } from 'pg';
import { seedDefaultRoles } from '../seeds/seed-default-roles';
import { seedDemoClients } from '../seeds/seed-demo-clients';
import { seedAdminUser } from '../seeds/seed-admin-user';
async function main() { const pool = new Pool({ connectionString: process.env.SSO_LOGIN_PRIMARY_URL }); await seedDefaultRoles(pool); await seedDemoClients(pool); await seedAdminUser(pool); await pool.end(); console.log('Seed completed'); }
main().catch((e) => { console.error(e); process.exit(1); });
`);
write('scripts/generate-jwks.ts', `import { generateKeyPair, exportJWK } from 'jose';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
async function main() { const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true }); const privateJwk = await exportJWK(privateKey); const publicJwk = await exportJWK(publicKey); privateJwk.use = 'sig'; publicJwk.use = 'sig'; privateJwk.kid = publicJwk.kid = 'sso-default'; const privatePath = process.env.OIDC_PRIVATE_JWK_PATH ?? './secrets/oidc-private.jwk.json'; const publicPath = process.env.OIDC_PUBLIC_JWKS_PATH ?? './secrets/oidc-jwks.json'; mkdirSync(dirname(privatePath), { recursive: true }); writeFileSync(privatePath, JSON.stringify(privateJwk, null, 2)); writeFileSync(publicPath, JSON.stringify({ keys: [publicJwk] }, null, 2)); console.log('JWKS generated'); }
main();
`);
write('scripts/test-db-connections.ts', `import 'dotenv/config';
import { Pool } from 'pg';
async function test(name: string, url?: string) { if (!url) return console.log(name, 'not configured'); const pool = new Pool({ connectionString: url, max: 1 }); try { await pool.query('SELECT 1'); console.log(name, 'ok'); } catch (e: any) { console.error(name, e.message); } finally { await pool.end(); } }
async function main() { await test('SSO_LOGIN_PRIMARY_URL', process.env.SSO_LOGIN_PRIMARY_URL); await test('PROJECT_A_DATABASE_URL', process.env.PROJECT_A_DATABASE_URL); await test('PROJECT_B_DATABASE_URL', process.env.PROJECT_B_DATABASE_URL); }
main();
`);
write('scripts/smoke-test-oidc.ts', `const issuer = process.env.OIDC_ISSUER ?? 'http://localhost:3000';
async function main() { const res = await fetch(issuer + '/.well-known/openid-configuration'); console.log('discovery', res.status); console.log(await res.text()); }
main().catch((e) => { console.error(e); process.exit(1); });
`);

write('test/jest-e2e.json', `{"moduleFileExtensions":["js","json","ts"],"rootDir":"..","testEnvironment":"node","testRegex":".e2e-spec.ts$","transform":{"^.+\\.(t|j)s$":"ts-jest"},"moduleNameMapper":{"^@/(.*)$":"<rootDir>/src/$1"}}`);
write('test/unit/auth.service.spec.ts', `describe('AuthService', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/unit/oidc-provider.service.spec.ts', `describe('OidcProviderService', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/unit/db-connection-manager.service.spec.ts', `describe('DbConnectionManagerService', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/unit/audit-logger.service.spec.ts', `describe('AuditLoggerService', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/e2e/oidc-flow.e2e-spec.ts', `describe('OIDC flow e2e', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/e2e/login-ui.e2e-spec.ts', `describe('Login UI e2e', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/e2e/db-health.e2e-spec.ts', `describe('DB health e2e', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/e2e/admin-api.e2e-spec.ts', `describe('Admin API e2e', () => { it('placeholder', () => expect(true).toBe(true)); });\n`);
write('test/fixtures/users.fixture.ts', `export const usersFixture = [{ id: '00000000-0000-0000-0000-000000000001', email: 'admin@sso.local' }];\n`);
write('test/fixtures/clients.fixture.ts', `export const clientsFixture = [{ client_id: 'project-a-web' }];\n`);
write('test/fixtures/tokens.fixture.ts', `export const tokensFixture = { accessToken: 'test' };\n`);

write('docker-compose.local.yml', `services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: sso_app_user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sso_login
    ports: ['5432:5432']
    volumes: [postgres_data:/var/lib/postgresql/data]
  mongo:
    image: mongo:7
    ports: ['27017:27017']
    volumes: [mongo_data:/data/db]
volumes:
  postgres_data:
  mongo_data:
`);
write('docker-compose.ha.yml', `services:
  etcd1:
    image: quay.io/coreos/etcd:v3.5.15
    command: etcd --name etcd1 --data-dir /etcd-data --listen-client-urls http://0.0.0.0:2379 --advertise-client-urls http://etcd1:2379
  haproxy:
    image: haproxy:2.9
    ports: ['5433:5432','8404:8404']
    volumes: ['./infrastructure/postgres-ha/haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro']
  pgbouncer:
    image: edoburu/pgbouncer:latest
    ports: ['6432:5432']
    volumes: ['./infrastructure/postgres-ha/pgbouncer/pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro','./infrastructure/postgres-ha/pgbouncer/userlist.example.txt:/etc/pgbouncer/userlist.txt:ro']
`);
write('infrastructure/docker/app.Dockerfile', `FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM deps AS build
COPY . .
RUN npm run build
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY public ./public
USER nestjs
EXPOSE 3000
CMD ["node","dist/main.js"]
`);
write('infrastructure/docker/nginx.Dockerfile', `FROM nginx:1.27-alpine
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
`);
write('infrastructure/nginx/nginx.conf', `events {}
http { server { listen 8080; location / { proxy_pass http://sso-api:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; } } }
`);
write('infrastructure/postgres-ha/haproxy/haproxy.cfg', `global
  log stdout format raw local0

defaults
  log global
  mode tcp
  timeout connect 5s
  timeout client 60s
  timeout server 60s

frontend postgres_write
  bind *:5432
  default_backend postgres_primary

backend postgres_primary
  option httpchk GET /primary
  server pg1 postgres1:5432 check port 8008
  server pg2 postgres2:5432 check port 8008
  server pg3 postgres3:5432 check port 8008

listen stats
  bind *:8404
  mode http
  stats enable
  stats uri /stats
`);
write('infrastructure/postgres-ha/pgbouncer/pgbouncer.ini', `[databases]
sso_login = host=haproxy port=5432 dbname=sso_login

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 5432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 500
default_pool_size = 50
`);
write('infrastructure/postgres-ha/pgbouncer/userlist.example.txt', `"sso_app_user" "md5replace_with_md5_hash"\n`);
['patroni-node1.yml','patroni-node2.yml','patroni-node3.yml'].forEach((f,i)=>write(`infrastructure/postgres-ha/patroni/${f}`, `scope: sso-postgres
name: postgres${i+1}
restapi:
  listen: 0.0.0.0:8008
postgresql:
  listen: 0.0.0.0:5432
  data_dir: /var/lib/postgresql/data
etcd:
  hosts: etcd1:2379,etcd2:2379,etcd3:2379
`));
['etcd-node1.env','etcd-node2.env','etcd-node3.env'].forEach((f,i)=>write(`infrastructure/postgres-ha/etcd/${f}`, `ETCD_NAME=etcd${i+1}\nETCD_DATA_DIR=/etcd-data\n`));
['init-cluster.ps1','backup-snapshot.ps1','restore-snapshot.ps1','failover-test.ps1'].forEach(f=>write(`infrastructure/postgres-ha/scripts/${f}`, `Write-Host "${f} placeholder - follow guide/07-patroni-etcd-haproxy-pgbouncer.md"\n`));
write('infrastructure/mongodb/replica-set-init.js', `rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo1:27017'}]});\n`);
write('infrastructure/mongodb/indexes.js', `db.getSiblingDB('sso_audit').audit_logs.createIndex({createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({eventType:1,createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({userId:1,createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({clientApp:1,createdAt:-1});
db.getSiblingDB('sso_audit').audit_logs.createIndex({requestId:1});
`);

write('infrastructure/kubernetes/namespaces/sso-dev.namespace.yml', `apiVersion: v1
kind: Namespace
metadata: { name: sso-dev }
`);
write('infrastructure/kubernetes/namespaces/sso-staging.namespace.yml', `apiVersion: v1
kind: Namespace
metadata: { name: sso-staging }
`);
write('infrastructure/kubernetes/namespaces/sso-prod.namespace.yml', `apiVersion: v1
kind: Namespace
metadata: { name: sso-prod }
`);
write('infrastructure/kubernetes/base/sso-api.deployment.yml', `apiVersion: apps/v1
kind: Deployment
metadata: { name: sso-api }
spec:
  replicas: 2
  selector: { matchLabels: { app: sso-api } }
  template:
    metadata: { labels: { app: sso-api } }
    spec:
      containers:
        - name: sso-api
          image: sso-api:0.1.0
          ports: [{ containerPort: 3000 }]
          envFrom: [{ secretRef: { name: sso-api-secret } }, { configMapRef: { name: sso-api-config } }]
          readinessProbe: { httpGet: { path: /health/ready, port: 3000 } }
          livenessProbe: { httpGet: { path: /health/live, port: 3000 } }
          resources: { requests: { cpu: 100m, memory: 256Mi }, limits: { cpu: 500m, memory: 512Mi } }
          securityContext: { runAsNonRoot: true, allowPrivilegeEscalation: false }
`);
write('infrastructure/kubernetes/base/sso-api.service.yml', `apiVersion: v1
kind: Service
metadata: { name: sso-api }
spec: { selector: { app: sso-api }, ports: [{ port: 80, targetPort: 3000 }] }
`);
write('infrastructure/kubernetes/base/sso-api.ingress.yml', `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: sso-api }
spec: { rules: [{ host: sso.example.com, http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: sso-api, port: { number: 80 } } } }] } }] }
`);
write('infrastructure/kubernetes/base/sso-api.configmap.yml', `apiVersion: v1
kind: ConfigMap
metadata: { name: sso-api-config }
data: { NODE_ENV: production, PORT: '3000' }
`);
write('infrastructure/kubernetes/base/sso-api.secret.example.yml', `apiVersion: v1
kind: Secret
metadata: { name: sso-api-secret }
type: Opaque
stringData:
  SSO_LOGIN_PRIMARY_URL: postgresql://user:password@pgbouncer:6432/sso_login
  MONGODB_AUDIT_URL: mongodb://mongo:27017/sso_audit
  OIDC_ISSUER: https://sso.example.com
  SESSION_SECRET: change-me-session-secret-at-least-32-chars
`);
write('infrastructure/kubernetes/base/sso-api.hpa.yml', `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: sso-api }
spec: { scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: sso-api }, minReplicas: 2, maxReplicas: 10, metrics: [{ type: Resource, resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } } }] }
`);
write('infrastructure/kubernetes/base/sso-api.pdb.yml', `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: sso-api }
spec: { minAvailable: 1, selector: { matchLabels: { app: sso-api } } }
`);
['dev','staging','prod'].forEach(env=>write(`infrastructure/kubernetes/overlays/${env}/kustomization.yml`, `resources:\n  - ../../base\nnamespace: sso-${env}\n`));
write('infrastructure/kubernetes/jobs/migration-job.yml', `apiVersion: batch/v1
kind: Job
metadata: { name: sso-migration }
spec: { template: { spec: { restartPolicy: Never, containers: [{ name: migration, image: sso-api:0.1.0, command: ['npm','run','migration:run'] }] } } }
`);
write('infrastructure/kubernetes/jobs/seed-job.yml', `apiVersion: batch/v1
kind: Job
metadata: { name: sso-seed }
spec: { template: { spec: { restartPolicy: Never, containers: [{ name: seed, image: sso-api:0.1.0, command: ['npm','run','seed'] }] } } }
`);
write('infrastructure/kubernetes/jobs/backup-verify-cronjob.yml', `apiVersion: batch/v1
kind: CronJob
metadata: { name: sso-backup-verify }
spec: { schedule: '*/5 * * * *', jobTemplate: { spec: { template: { spec: { restartPolicy: OnFailure, containers: [{ name: verify, image: sso-api:0.1.0, command: ['node','-e','console.log("backup verify placeholder")'] }] } } } } }
`);

write('infrastructure/helm/sso-api/Chart.yaml', `apiVersion: v2
name: sso-api
description: SSO API Helm chart
version: 0.1.0
appVersion: 0.1.0
`);
write('infrastructure/helm/sso-api/values.yaml', `replicaCount: 2
image:
  repository: sso-api
  tag: 0.1.0
  pullPolicy: IfNotPresent
service:
  port: 80
ingress:
  enabled: false
  host: sso.example.com
env:
  NODE_ENV: production
  PORT: '3000'
secret:
  create: false
resources:
  requests: { cpu: 100m, memory: 256Mi }
  limits: { cpu: 500m, memory: 512Mi }
`);
['dev','staging','prod'].forEach(env=>write(`infrastructure/helm/sso-api/values-${env}.yaml`, `env:\n  NODE_ENV: ${env === 'prod' ? 'production' : env}\n`));
write('infrastructure/helm/sso-api/templates/deployment.yaml', `apiVersion: apps/v1
kind: Deployment
metadata: { name: {{ include "sso-api.fullname" . | default "sso-api" }} }
spec:
  replicas: {{ .Values.replicaCount }}
  selector: { matchLabels: { app: sso-api } }
  template:
    metadata: { labels: { app: sso-api } }
    spec:
      serviceAccountName: sso-api
      containers:
        - name: sso-api
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports: [{ containerPort: 3000 }]
          envFrom: [{ configMapRef: { name: sso-api-config } }, { secretRef: { name: sso-api-secret } }]
`);
write('infrastructure/helm/sso-api/templates/service.yaml', `apiVersion: v1
kind: Service
metadata: { name: sso-api }
spec: { selector: { app: sso-api }, ports: [{ port: {{ .Values.service.port }}, targetPort: 3000 }] }
`);
write('infrastructure/helm/sso-api/templates/ingress.yaml', `{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: sso-api }
spec: { rules: [{ host: {{ .Values.ingress.host | quote }}, http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: sso-api, port: { number: {{ .Values.service.port }} } } } }] } }] }
{{- end }}
`);
write('infrastructure/helm/sso-api/templates/configmap.yaml', `apiVersion: v1
kind: ConfigMap
metadata: { name: sso-api-config }
data:
{{- range $key, $value := .Values.env }}
  {{ $key }}: {{ $value | quote }}
{{- end }}
`);
write('infrastructure/helm/sso-api/templates/secret.example.yaml', `apiVersion: v1
kind: Secret
metadata: { name: sso-api-secret }
type: Opaque
stringData:
  SSO_LOGIN_PRIMARY_URL: postgresql://user:password@pgbouncer:6432/sso_login
  MONGODB_AUDIT_URL: mongodb://mongo:27017/sso_audit
  OIDC_ISSUER: https://sso.example.com
  SESSION_SECRET: change-me-session-secret-at-least-32-chars
`);
write('infrastructure/helm/sso-api/templates/hpa.yaml', `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: sso-api }
spec: { scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: sso-api }, minReplicas: 2, maxReplicas: 10, metrics: [{ type: Resource, resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } } }] }
`);
write('infrastructure/helm/sso-api/templates/pdb.yaml', `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: sso-api }
spec: { minAvailable: 1, selector: { matchLabels: { app: sso-api } } }
`);
write('infrastructure/helm/sso-api/templates/serviceaccount.yaml', `apiVersion: v1
kind: ServiceAccount
metadata: { name: sso-api }
`);
write('infrastructure/helm/sso-api/templates/migration-job.yaml', `apiVersion: batch/v1
kind: Job
metadata: { name: sso-api-migration-{{ .Release.Revision }} }
spec: { template: { spec: { restartPolicy: Never, containers: [{ name: migration, image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}", command: ['npm','run','migration:run'] }] } } }
`);

write('infrastructure/monitoring/prometheus/prometheus.yml', `scrape_configs:
  - job_name: sso-api
    metrics_path: /metrics
    static_configs: [{ targets: ['sso-api:3000'] }]
`);
write('infrastructure/monitoring/prometheus/alert-rules.yml', `groups:
  - name: sso-api
    rules:
      - alert: SsoApiDown
        expr: up{job="sso-api"} == 0
        for: 1m
        labels: { severity: critical }
        annotations: { summary: SSO API down }
`);
write('infrastructure/monitoring/prometheus/recording-rules.yml', `groups: []\n`);
['sso-api-dashboard.json','oidc-flow-dashboard.json','postgres-ha-dashboard.json','mongodb-audit-dashboard.json','haproxy-pgbouncer-dashboard.json'].forEach(f=>write(`infrastructure/monitoring/grafana/dashboards/${f}`, `{"title":"${f.replace('.json','')}","panels":[],"schemaVersion":39}\n`));
write('infrastructure/monitoring/grafana/provisioning/dashboards.yml', `apiVersion: 1
providers: [{ name: sso, type: file, options: { path: /var/lib/grafana/dashboards } }]
`);
write('infrastructure/monitoring/grafana/provisioning/datasources.yml', `apiVersion: 1
datasources: [{ name: Prometheus, type: prometheus, url: http://prometheus:9090, access: proxy }]
`);
write('infrastructure/monitoring/alertmanager/alertmanager.yml', `route: { receiver: default }
receivers: [{ name: default }]
`);
write('infrastructure/monitoring/alertmanager/notification-templates.tmpl', `{{ define "default" }}SSO alert{{ end }}\n`);
['postgres-exporter.env.example','mongodb-exporter.env.example','haproxy-exporter.env.example','pgbouncer-exporter.env.example'].forEach(f=>write(`infrastructure/monitoring/exporters/${f}`, `# ${f}\n`));

write('.github/workflows/ci.yml', `name: CI
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
`);
write('.github/workflows/docker-build.yml', `name: Docker Build
on: { push: { branches: [main], tags: ['v*'] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -f infrastructure/docker/app.Dockerfile -t sso-api:\${{ github.sha }} .
`);
write('.github/workflows/helm-deploy-staging.yml', `name: Helm Deploy Staging
on: { workflow_dispatch: {} }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: helm lint infrastructure/helm/sso-api
`);
write('.github/workflows/helm-deploy-production.yml', `name: Helm Deploy Production
on: { workflow_dispatch: {} }
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: helm lint infrastructure/helm/sso-api
`);

write('docs/architecture.md', `# Kiến trúc SSO\n\nTheo kế hoạch tại plans/sso-project-plan.md, SSO dùng NestJS, oidc-provider, PostgreSQL HA endpoint qua PgBouncer/HAProxy và MongoDB audit.\n`);
write('docs/oauth2-oidc-flow.md', `# OAuth2/OIDC flow\n\nAuthorization Code Flow với PKCE là luồng chính.\n`);
write('docs/database-ha.md', `# Database HA\n\nProduction dùng Patroni + etcd + HAProxy + PgBouncer. Application không tự promote DB.\n`);
write('docs/pgadmin4-connections.md', `# pgAdmin4 connections\n\nDùng PgBouncer/HAProxy endpoint cho production.\n`);
write('docs/onboarding-new-project.md', `# Onboarding new project\n\nĐăng ký OIDC client, khai báo project DB, mapping user và test audit.\n`);
write('docs/backup-restore.md', `# Backup restore\n\nSnapshot backup là lớp bổ sung, không thay thế streaming replication.\n`);
write('docs/failover-runbook.md', `# Failover runbook\n\nKiểm tra Patroni leader, etcd quorum, HAProxy backend, PgBouncer và SSO readiness.\n`);
write('docs/deployment.md', `# Deployment\n\nStaging/production deploy bằng Helm qua CI/CD.\n`);

const guides = {
'guide/README.md':'# Guide vận hành dự án SSO\n\nĐọc theo thứ tự local, pgAdmin4, MongoDB, env, OIDC client, onboarding project, HA, Helm, monitoring, CI/CD, security và incident response.\n',
'guide/01-local-setup.md':'# Local setup\n\nCài Node.js LTS, Docker Desktop, pgAdmin4, MongoDB Compass. Chạy npm install, copy .env.example thành .env, chạy docker-compose.local.yml, migration, seed và npm run start:dev.\n',
'guide/02-pgadmin4-postgresql-setup.md':'# pgAdmin4 PostgreSQL setup\n\nTạo server connection, tạo database sso_login, tạo app user quyền tối thiểu, test SELECT version(); và tạo connection string.\n',
'guide/03-mongodb-compass-cluster-setup.md':'# MongoDB Compass cluster setup\n\nKết nối audit cluster, tạo sso_audit.audit_logs, tạo indexes và test insert audit event.\n',
'guide/04-env-and-connection-strings.md':'# Env and connection strings\n\nKhông commit .env thật. Production dùng Kubernetes Secret hoặc secret manager. SSO DB trỏ tới PgBouncer/HAProxy endpoint.\n',
'guide/05-oidc-client-registration.md':'# OIDC client registration\n\nKhai báo client_id, redirect_uri exact match, post logout redirect URI, scopes, PKCE và client secret nếu confidential.\n',
'guide/06-project-db-onboarding.md':'# Project DB onboarding\n\nThêm OIDC client, project DB config, env connection string, user mapping, test login, userinfo và audit log.\n',
'guide/07-patroni-etcd-haproxy-pgbouncer.md':'# Patroni etcd HAProxy PgBouncer\n\nThiết lập PostgreSQL HA: Patroni quản lý nodes, etcd consensus, HAProxy route primary, PgBouncer pooling.\n',
'guide/08-kubernetes-helm-deployment.md':'# Kubernetes Helm deployment\n\nDeploy staging/prod bằng Helm, chạy migration job, smoke test, rollout status và rollback khi lỗi.\n',
'guide/09-monitoring-prometheus-grafana-alertmanager.md':'# Monitoring Prometheus Grafana Alertmanager\n\nPrometheus scrape /metrics, Grafana dashboard, Alertmanager cảnh báo SSO down, token error, login failed spike, DB failover.\n',
'guide/10-cicd-release-rollback.md':'# CI/CD release rollback\n\nBranch strategy, SemVer, Docker tag cố định, Helm deploy staging/prod và rollback policy.\n',
'guide/11-security-production-checklist.md':'# Security production checklist\n\nChecklist OIDC, session, secrets, DB/data, Kubernetes, monitoring/logging, CI/CD trước go-live.\n',
'guide/12-incident-response-runbook.md':'# Incident response runbook\n\nRunbook cho login lỗi, token lỗi, DB failover, Mongo audit lỗi, signing key lỗi và rollback release.\n',
'guide/rules.md':'# Project rules\n\nDùng NestJS module rõ ràng, không hardcode secret, DTO validate input, không log token/password/client secret, migration backward compatible, production deploy qua CI/CD.\n',
'guide/instructions.md':'# Project instructions\n\nDeveloper tạo branch từ develop, chạy local, viết test, không commit secret. DevOps quản lý secret và Helm deploy. Admin onboarding project theo guide.\n'
};
for (const [file, content] of Object.entries(guides)) write(file, content);
write('secrets/.gitkeep', '');
write('secrets/README.md', `# Secrets\n\nKhông commit secret thật. Dùng thư mục này cho file mẫu local được tạo thủ công như JWKS dev; các file JSON secret đã bị ignore.\n`);
write('infrastructure/ci-cd/github-actions/ci.md', '# CI workflow\n\nChạy lint, typecheck, test và security scan.\n');
write('infrastructure/ci-cd/github-actions/docker-build.md', '# Docker build workflow\n\nBuild image tag SemVer và Git SHA.\n');
write('infrastructure/ci-cd/github-actions/helm-deploy.md', '# Helm deploy workflow\n\nDeploy staging/prod qua Helm và manual approval.\n');
write('infrastructure/ci-cd/quality-gates.md', '# Quality gates\n\nCI, tests, scans, Helm lint/template phải pass.\n');
write('infrastructure/ci-cd/release-strategy.md', '# Release strategy\n\nSemantic Versioning, release branch và fixed image tags.\n');
write('infrastructure/ci-cd/rollback-strategy.md', '# Rollback strategy\n\nHelm rollback cho app; migration dùng expand-contract và forward-fix.\n');

write('README.md', `# sso-vietprodev

Production-ready SSO Authorization Server scaffold theo kế hoạch tại \`plans/sso-project-plan.md\`.

## Stack chính

- NestJS + TypeScript
- \`oidc-provider\` cho OAuth2/OIDC Authorization Server
- PostgreSQL qua HA endpoint PgBouncer/HAProxy, quản lý HA bởi Patroni + etcd
- MongoDB audit log
- Prometheus metrics tại \`/metrics\`
- Health endpoints: \`/health/live\`, \`/health/ready\`, \`/health/dependencies\`
- Docker Compose local, Kubernetes/Helm production scaffold, GitHub Actions CI/CD scaffold

## Chạy local

1. Copy \`.env.example\` thành \`.env\` và chỉnh connection string.
2. Chạy \`docker compose -f docker-compose.local.yml up -d\` nếu cần DB local.
3. Chạy \`npm install\`.
4. Chạy \`npm run migration:run\`.
5. Chạy \`npm run seed\`.
6. Chạy \`npm run start:dev\`.

## Tài liệu

- Kế hoạch tổng: \`plans/sso-project-plan.md\`
- Guide thao tác: \`guide/README.md\`
- Kiến trúc: \`docs/architecture.md\`
`);

console.log('SSO scaffold generated successfully');
