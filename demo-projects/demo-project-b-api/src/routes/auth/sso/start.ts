import { startSso } from '../../../sso.service';

export default () => ({ get: { middleware: [], handler: startSso } });
