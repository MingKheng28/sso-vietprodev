import { authenticate } from '../../auth.middleware';
import { logout } from '../../local-auth.service';

export default () => ({ post: { middleware: [authenticate], handler: logout } });
