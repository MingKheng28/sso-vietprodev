import { config } from '../config';

export default () => ({ get: { middleware: [], handler: async (_req: any, res: any) => res.json({ status: 'ok', app: config.appName, appCode: config.appCode, timestamp: new Date().toISOString() }) } });
