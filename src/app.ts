import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyCookie from '@fastify/cookie';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { AppConfig } from './config.js';
import { DB } from './db/index.js';
import { healthRoutes } from './routes/health.js';
import { scoreRoutes } from './routes/score.js';
import { syncRoutes } from './routes/sync.js';
import { connectionsRoutes } from './routes/connections.js';

export async function buildApp(config: AppConfig, db: DB) {
  const app = Fastify({ logger: true });
  app.decorate('config', config);
  app.decorate('db', db);

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(currentDir, '..');
  const publicDir = fs.existsSync(path.join(currentDir, 'public'))
    ? path.join(currentDir, 'public')
    : path.join(rootDir, 'public');
  const viewsDir = fs.existsSync(path.join(currentDir, 'views'))
    ? path.join(currentDir, 'views')
    : path.join(rootDir, 'views');

  await app.register(fastifyCookie);
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/public/',
  });
  const ejs = await import('ejs');
  await app.register(fastifyView, {
    engine: { ejs },
    root: viewsDir,
    viewExt: 'ejs',
  });

  await app.register(healthRoutes);
  await app.register(syncRoutes);
  await app.register(scoreRoutes);
  await app.register(connectionsRoutes);

  return app;
}
