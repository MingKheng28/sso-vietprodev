import { authenticate } from '../../auth.middleware';
import { toPublicUser } from '../../local-auth.service';

export default () => ({ get: { middleware: [authenticate], handler: async (req: any, res: any) => res.json({ user: toPublicUser(req.user) }) } });
