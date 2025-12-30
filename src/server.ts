import { loadConfig } from './config.js';
import { initDatabase } from './db/index.js';
import { buildApp } from './app.js';

async function start() {
  const config = loadConfig();
  const db = initDatabase(config.databasePath);
  const app = await buildApp(config, db);

  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`Server listening on port ${config.port}`);
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
