import { AppConfig } from '../config.js';
import { DB } from '../db/index.js';
import '@fastify/view';
import '@fastify/cookie';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    db: DB;
  }

  interface FastifyReply {
    view: (template: string, data?: unknown) => Promise<string> | string;
    setCookie: (name: string, value: string, options?: unknown) => void;
  }

  interface FastifyRequest {
    cookies: Record<string, string>;
  }
}
