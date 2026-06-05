import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
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
  const securityMiddleware = new SecurityHeadersMiddleware();
  app.use((req, res, next) => securityMiddleware.use(req, res, next));

  const csrfProtection = csurf({
    cookie: { httpOnly: false, sameSite: 'strict' },
    value: (req: any) =>
      req.body?._csrf ?? req.headers['x-csrf-token'] ?? req.headers['x-xsrf-token'],
  });
  app.use((req: any, res: any, next: any) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    // OIDC interaction routes are protected by _interaction session cookie — skip CSRF
    if (req.path.startsWith('/oidc/interaction/')) {
      return next();
    }
    // OAuth2 token/revoke/introspect endpoints use PKCE/client credentials — skip CSRF
    if (
      req.path === '/oauth/token' ||
      req.path === '/oauth/revoke' ||
      req.path === '/oauth/introspect'
    ) {
      return next();
    }
    csrfProtection(req, res, (err: unknown) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
      return next();
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setBaseViewsDir(join(process.cwd(), 'src', 'oidc', 'views'));
  app.setViewEngine('hbs');
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/public' });

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true });
  if (globalPrefix) app.setGlobalPrefix(globalPrefix);

  void app.listen(port);
}

void bootstrap();
