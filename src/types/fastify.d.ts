import { AppConfig } from '../config.js';
import { DB } from '../db/index.js';
import '@fastify/view';
import '@fastify/cookie';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    db: DB;
  }
}
