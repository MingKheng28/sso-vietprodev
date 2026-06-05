import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './jwt';
import { User } from './models';
import { validateSession } from './session.service';

declare global { namespace Express { interface Request { user?: User; } } }

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    const accessToken = bearer ?? req.cookies?.access_token;
    if (!accessToken) return res.status(401).json({ message: 'Missing access token' });
    const payload = verifyAccessToken(accessToken);
    const session = await validateSession(accessToken);
    if (!session) return res.status(401).json({ message: 'Invalid or expired session' });
    const user = await User.findByPk(payload.sub);
    if (!user || user.status !== 'active') return res.status(401).json({ message: 'User is not active' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
