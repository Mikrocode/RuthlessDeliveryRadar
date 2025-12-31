import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, reply) => reply.redirect('/connections'));
  app.get('/health', async () => ({ ok: true }));
}
