import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { detectPlatform, getPlatformInfo } from '../lib/platform.js';
import { isBot, identifyBot } from '../lib/isBot.js';
import { buildRedirectUrl, extractPassthroughParams } from '../lib/urlBuilder.js';
import { generatePreviewHtml } from '../lib/preview.js';
import { hashIP } from '../lib/hash.js';
import { getLinksConfig, getAllowedHosts, getEnvConfig } from '../config.js';

// Query params schema
const querySchema = z.object({
  phone: z.string().optional(),
  text: z.string().optional(),
  _continue: z.string().optional(), // Internal flag to bypass bot detection
}).passthrough(); // Allow additional params (utm_* etc.)

// Route params schema
const paramsSchema = z.object({
  slug: z.string().min(1),
});

export async function redirectRoutes(fastify: FastifyInstance) {
  const linksConfig = getLinksConfig();
  const envConfig = getEnvConfig();
  const allowedHosts = getAllowedHosts(envConfig.ALLOWED_HOSTS);

  /**
   * GET /r/:slug - Main redirect endpoint
   */
  fastify.get<{
    Params: { slug: string };
    Querystring: Record<string, string>;
  }>('/r/:slug', async (request, reply) => {
    const startTime = Date.now();

    // Parse and validate params
    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        error: 'Invalid slug',
        details: paramsResult.error.format(),
      });
    }

    const { slug } = paramsResult.data;

    // Parse query params
    const queryResult = querySchema.safeParse(request.query);
    if (!queryResult.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: queryResult.error.format(),
      });
    }

    const queryParams = queryResult.data;
    const userAgent = request.headers['user-agent'];
    const referer = request.headers['referer'] || request.headers['referrer'];

    // Check if slug exists in config
    const linkConfig = linksConfig[slug];
    if (!linkConfig) {
      request.log.warn({ slug }, 'Slug not found');
      return reply.status(404).send({
        error: 'Link not found',
        slug,
      });
    }

    // Check if request is from a bot (and not a continue request)
    const isBotRequest = isBot(userAgent) && queryParams._continue !== '1';

    if (isBotRequest) {
      const botName = identifyBot(userAgent);
      request.log.info({
        event: 'bot_preview',
        slug,
        bot: botName,
        userAgent,
        hashedIp: hashIP(request.ip),
      });

      // Return preview HTML for bots
      const queryString = new URLSearchParams(
        Object.entries(request.query as Record<string, string>).filter(
          ([key]) => key !== '_continue'
        )
      ).toString();

      const protocol = request.headers['x-forwarded-proto'] || 'http';
      const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost';
      const baseUrl = `${protocol}://${host}`;

      const html = generatePreviewHtml({
        slug,
        linkConfig,
        queryString,
        baseUrl,
      });

      return reply
        .status(200)
        .header('Content-Type', 'text/html; charset=utf-8')
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .send(html);
    }

    // Detect platform
    const platformInfo = getPlatformInfo(userAgent);
    const platform = platformInfo.platform;

    // Build redirect URL - convert queryParams to RedirectParams type
    const redirectParams: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      redirectParams[key] = typeof value === 'string' ? value : undefined;
    }
    const result = buildRedirectUrl(platform, linkConfig, redirectParams, allowedHosts);

    if (!result.isValid) {
      request.log.error({
        event: 'redirect_error',
        slug,
        platform,
        error: result.error,
        hashedIp: hashIP(request.ip),
      });

      if (result.error?.includes('Phone number is required')) {
        return reply.status(400).send({
          error: 'Phone number is required',
          message: 'Please provide a phone number via the "phone" query parameter',
        });
      }

      return reply.status(500).send({
        error: 'Failed to build redirect URL',
        message: result.error,
      });
    }

    // Log the redirect event
    const duration = Date.now() - startTime;
    request.log.info({
      event: 'redirect',
      slug,
      platform,
      browser: platformInfo.browser,
      os: platformInfo.os,
      referer: referer || null,
      hashedIp: hashIP(request.ip),
      durationMs: duration,
      targetHost: new URL(result.url).hostname,
    });

    // Perform the redirect
    return reply
      .status(302)
      .header('Location', result.url)
      .header('Cache-Control', 'no-cache, no-store, must-revalidate')
      .header('Pragma', 'no-cache')
      .header('Expires', '0')
      .send();
  });

  /**
   * GET /preview/:slug - Explicit preview page endpoint
   */
  fastify.get<{
    Params: { slug: string };
    Querystring: Record<string, string>;
  }>('/preview/:slug', async (request, reply) => {
    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        error: 'Invalid slug',
        details: paramsResult.error.format(),
      });
    }

    const { slug } = paramsResult.data;

    const linkConfig = linksConfig[slug];
    if (!linkConfig) {
      return reply.status(404).send({
        error: 'Link not found',
        slug,
      });
    }

    const queryString = new URLSearchParams(
      request.query as Record<string, string>
    ).toString();

    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost';
    const baseUrl = `${protocol}://${host}`;

    const html = generatePreviewHtml({
      slug,
      linkConfig,
      queryString,
      baseUrl,
    });

    request.log.info({
      event: 'preview_view',
      slug,
      hashedIp: hashIP(request.ip),
    });

    return reply
      .status(200)
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Cache-Control', 'public, max-age=300')
      .send(html);
  });
}
