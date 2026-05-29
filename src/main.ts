import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
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
  app.setBaseViewsDir(join(process.cwd(), 'src', 'oidc', 'views'));
  app.setViewEngine('hbs');
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/public' });

  const corsOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true });
  if (globalPrefix) app.setGlobalPrefix(globalPrefix);

  await app.listen(port);
}

bootstrap();
