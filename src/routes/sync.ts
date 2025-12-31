import { FastifyInstance } from 'fastify';
import { syncRepoEvents } from '../github/sync.js';

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.post('/sync', async () => {
    const result = await syncRepoEvents(app.db, app.config);
    return result;
  });
}
