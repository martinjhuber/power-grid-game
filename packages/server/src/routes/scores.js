import { fetchLeaderboard, setPlayerName, submitScore } from '../services/scoreService.js';

export async function registerScoreRoutes(fastify) {
  fastify.post('/api/scores', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { session, statistics, clientScore, appVersion } = request.body ?? {};

    if (!session?.puzzle || !session?.events || !session?.outcome) {
      return reply.code(400).send({ error: 'Invalid session payload' });
    }

    try {
      const result = await submitScore({
        session,
        statistics,
        clientScore,
        appVersion,
      });
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to store score' });
    }
  });

  fastify.patch('/api/scores/:id/name', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, editToken } = request.body ?? {};

    if (!name || !editToken) {
      return reply.code(400).send({ error: 'Missing name or editToken' });
    }

    try {
      await setPlayerName(id, name, editToken);
      return { ok: true };
    } catch (error) {
      if (error.statusCode === 400) {
        return reply.code(400).send({ error: error.message });
      }
      if (error.statusCode === 403) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update name' });
    }
  });

  fastify.get('/api/leaderboard', async (_request, reply) => {
    try {
      const entries = await fetchLeaderboard();
      return { entries };
    } catch (error) {
      _request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });
}
