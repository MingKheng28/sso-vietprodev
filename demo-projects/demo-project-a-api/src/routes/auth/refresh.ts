import { Request, Response } from 'express';
import { refreshProjectSession } from '../../session.service';

export default () => ({
  post: {
    middleware: [],
    handler: async (req: Request, res: Response) => refreshProjectSession(req.cookies?.refresh_token, req, res),
  },
});
