import type { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health - Health check endpoint
   * Returns 200 "ok" for load balancers and monitoring
   */
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send('ok');
  });

  /**
   * GET /health/ready - Readiness check
   * Can be extended to check database connections, etc.
   */
  fastify.get('/health/ready', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /health/live - Liveness check
   */
  fastify.get('/health/live', async (_request, reply) => {
    return reply.status(200).send({
      status: 'live',
      timestamp: new Date().toISOString(),
    });
  });
}
