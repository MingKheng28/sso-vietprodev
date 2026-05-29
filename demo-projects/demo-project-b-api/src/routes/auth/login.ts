import { localLogin } from '../../local-auth.service';

export default () => ({ post: { middleware: [], handler: localLogin } });
