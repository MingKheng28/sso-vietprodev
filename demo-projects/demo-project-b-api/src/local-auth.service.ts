import { Request, Response } from 'express';
import { User } from './models';
import { createProjectSession, deactivateSession } from './session.service';

export async function localLogin(req: Request, res: Response) {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ message: 'email is required' });
  const user = await User.findOne({ where: { email, status: 'active' } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  await createProjectSession(user, req, res);
  return res.json({ user: toPublicUser(user), authMode: 'local-demo' });
}

export async function logout(req: Request, res: Response) {
  await deactivateSession(req.cookies?.access_token);
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return res.json({ ok: true });
}

export function toPublicUser(user: User) {
  return { id: user.id, email: user.email, username: user.username, firstName: user.first_name, lastName: user.last_name, status: user.status };
}
