import cookieParser from 'cookie-parser';
import express from 'express';
import { config } from './config';
import { bindResource } from './router';
import health from './routes/health';
import login from './routes/auth/login';
import logout from './routes/auth/logout';
import me from './routes/auth/me';
import refresh from './routes/auth/refresh';
import ssoStart from './routes/auth/sso/start';
import ssoCallback from './routes/auth/sso/callback';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.json';

function sanitizeError(error: unknown): Record<string, unknown> {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    return {
      message: e.message ?? 'Internal demo API error',
      status: e.status ?? (e.response as any)?.status,
    };
  }
  return { message: 'Internal demo API error' };
}

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Demo Project A API',
    swaggerOptions: { persistAuthorization: true },
  }));

  bindResource(app as any, '/health', health());
  bindResource(app as any, '/auth/login', login());
  bindResource(app as any, '/auth/logout', logout());
  bindResource(app as any, '/auth/me', me());
  bindResource(app as any, '/auth/refresh', refresh());
  bindResource(app as any, '/auth/sso/start', ssoStart());
  bindResource(app as any, '/auth/sso/callback', ssoCallback());
  app.get('/', (_req, res) => res.json({ app: config.appName, appCode: config.appCode }));
  app.use((error: any, _req: any, res: any, _next: any) => {
    if (res.headersSent) return;
    const safe = sanitizeError(error);
    return res.status(500).json(safe);
  });
  return app;
}
