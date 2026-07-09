import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import { closePool, runMigrations } from './db/pool.js';
import { registerScoreRoutes } from './routes/scores.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '../../client');
const sharedRoot = path.join(__dirname, '../../shared/src');

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function buildServer() {
  const fastify = Fastify({
    logger: true,
    bodyLimit: 512 * 1024,
  });

  await fastify.register(rateLimit, {
    global: false,
  });

  await fastify.register(fastifyStatic, {
    root: sharedRoot,
    prefix: '/shared/',
    decorateReply: false,
  });

  await fastify.register(fastifyStatic, {
    root: clientRoot,
    prefix: '/',
    decorateReply: false,
  });

  await registerScoreRoutes(fastify);

  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html', clientRoot);
  });

  return fastify;
}

async function main() {
  await runMigrations();
  const fastify = await buildServer();

  const shutdown = async () => {
    await fastify.close();
    await closePool();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await fastify.listen({ port: PORT, host: HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
