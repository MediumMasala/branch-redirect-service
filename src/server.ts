import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { getEnvConfig } from './config.js';
import { healthRoutes } from './routes/health.js';
import { redirectRoutes } from './routes/redirect.js';

async function buildServer() {
  const config = getEnvConfig();

  // Initialize Fastify with Pino logger
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    trustProxy: true, // Trust X-Forwarded-* headers
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (request) => {
      // Use X-Forwarded-For if available (behind proxy), otherwise use IP
      return request.ip;
    },
    errorResponseBuilder: (_request, context) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  });

  // Add security headers
  fastify.addHook('onSend', async (_request, reply, _payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
    );
    reply.header(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(redirectRoutes);

  // Custom 404 handler
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource does not exist',
    });
  });

  // Custom error handler
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    });

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    // Handle rate limit errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: error.message,
      });
    }

    // Generic error response
    return reply.status(error.statusCode || 500).send({
      error: 'Internal Server Error',
      message:
        config.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred',
    });
  });

  return fastify;
}

async function start() {
  const config = getEnvConfig();
  const fastify = await buildServer();

  try {
    await fastify.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    fastify.log.info(`Server started on port ${config.PORT}`);
    fastify.log.info(`Environment: ${config.NODE_ENV}`);
    fastify.log.info(`Allowed hosts: ${config.ALLOWED_HOSTS}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, shutting down gracefully...`);
      await fastify.close();
      process.exit(0);
    });
  }
}

// Export for testing
export { buildServer };

// Start server if this is the main module
start();
