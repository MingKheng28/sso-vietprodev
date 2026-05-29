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

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  bindResource(app as any, '/health', health());
  bindResource(app as any, '/auth/login', login());
  bindResource(app as any, '/auth/logout', logout());
  bindResource(app as any, '/auth/me', me());
  bindResource(app as any, '/auth/refresh', refresh());
  bindResource(app as any, '/auth/sso/start', ssoStart());
  bindResource(app as any, '/auth/sso/callback', ssoCallback());
  app.get('/', (_req, res) => res.json({ app: config.appName, appCode: config.appCode }));
  app.use((error: any, _req: any, res: any, _next: any) => {
    console.error(error?.response?.data ?? error);
    if (res.headersSent) return;
    return res.status(500).json({ message: 'Internal demo API error', detail: error?.response?.data ?? error?.message ?? 'Unknown error' });
  });
  return app;
}
