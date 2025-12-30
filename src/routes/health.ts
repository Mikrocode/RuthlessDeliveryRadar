import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async () => ({ ok: true, message: 'RuthlessDeliveryRadar API' }));
  app.get('/health', async () => ({ ok: true }));
}
