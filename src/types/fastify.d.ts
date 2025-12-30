import { AppConfig } from '../config.js';
import { DB } from '../db/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    db: DB;
  }
}
