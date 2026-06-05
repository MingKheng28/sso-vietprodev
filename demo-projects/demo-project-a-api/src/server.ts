import { config } from './config';
import { createApp } from './app';
import { assertDatabaseConnection } from './database';
import './models';

async function bootstrap() {
  await assertDatabaseConnection();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(config.appName + ' listening on http://localhost:' + config.port);
  });
}

bootstrap().catch((error) => { console.error(error); process.exit(1); });
