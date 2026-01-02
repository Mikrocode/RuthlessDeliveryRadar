import { FastifyInstance } from 'fastify';
import { getConnection } from '../db/connections.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, reply) => {
    const jira = getConnection(app.db, 'jira');
    const gitlab = getConnection(app.db, 'gitlab');
    return reply.view('home', { jira, gitlab });
  });
  app.get('/health', async () => ({ ok: true }));
}
