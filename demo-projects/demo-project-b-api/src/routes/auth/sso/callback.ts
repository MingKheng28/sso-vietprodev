import { ssoCallback } from '../../../sso.service';

export default () => ({ get: { middleware: [], handler: ssoCallback } });
