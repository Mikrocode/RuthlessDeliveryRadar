import Fastify from 'fastify';
import { AppConfig } from './config.js';
import { DB } from './db/index.js';
import { healthRoutes } from './routes/health.js';
import { scoreRoutes } from './routes/score.js';
import { syncRoutes } from './routes/sync.js';

export async function buildApp(config: AppConfig, db: DB) {
  const app = Fastify({ logger: true });
  app.decorate('config', config);
  app.decorate('db', db);

  await app.register(healthRoutes);
  await app.register(syncRoutes);
  await app.register(scoreRoutes);

  return app;
}
