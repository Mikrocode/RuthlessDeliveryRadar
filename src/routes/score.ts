import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { computeAndStoreDailyRisk } from '../scoring/risk.js';

const dayParamSchema = z.object({
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Day in YYYY-MM-DD format'),
});

export async function scoreRoutes(app: FastifyInstance): Promise<void> {
  app.get('/score/today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    return computeAndStoreDailyRisk(app.db, today);
  });

  app.get('/score/:day', async (request, reply) => {
    const parsed = dayParamSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'Invalid day format, expected YYYY-MM-DD' };
    }

    const { day } = parsed.data;
    return computeAndStoreDailyRisk(app.db, day);
  });
}
