import type { VercelRequest, VercelResponse } from '@vercel/node';
import { detectPlatform, getPlatformInfo } from '../src/lib/platform.js';
import { isBot, identifyBot } from '../src/lib/isBot.js';
import { buildRedirectUrl } from '../src/lib/urlBuilder.js';
import { generatePreviewHtml } from '../src/lib/preview.js';
import { hashIP } from '../src/lib/hash.js';
import linksConfig from '../config/links.json' with { type: 'json' };

const ALLOWED_HOSTS = new Set(
  (process.env.ALLOWED_HOSTS || 'wa.me,api.whatsapp.com,web.whatsapp.com')
    .split(',')
    .map((h) => h.trim().toLowerCase())
);

function addSecurityHeaders(res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  addSecurityHeaders(res);

  const { url } = req;
  const path = url?.split('?')[0] || '';

  // Health check
  if (path === '/health' || path === '/api/health') {
    return res.status(200).send('ok');
  }

  // Extract slug from path: /r/:slug or /api/r/:slug
  const redirectMatch = path.match(/^\/(?:api\/)?r\/([^\/]+)$/);
  const previewMatch = path.match(/^\/(?:api\/)?preview\/([^\/]+)$/);

  if (redirectMatch) {
    return handleRedirect(req, res, redirectMatch[1] as string);
  }

  if (previewMatch) {
    return handlePreview(req, res, previewMatch[1] as string);
  }

  // 404 for unknown routes
  return res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
}

function handleRedirect(req: VercelRequest, res: VercelResponse, slug: string) {
  const linkConfig = (linksConfig as Record<string, any>)[slug];

  if (!linkConfig) {
    return res.status(404).json({
      error: 'Link not found',
      slug,
    });
  }

  const userAgent = req.headers['user-agent'] as string | undefined;
  const query = req.query as Record<string, string>;
  const continueFlag = query._continue;

  // Bot detection
  const isBotRequest = isBot(userAgent) && continueFlag !== '1';

  if (isBotRequest) {
    const botName = identifyBot(userAgent);
    console.log(JSON.stringify({
      event: 'bot_preview',
      slug,
      bot: botName,
      hashedIp: hashIP(req.headers['x-forwarded-for'] as string),
    }));

    const queryString = new URLSearchParams(
      Object.entries(query).filter(([key]) => key !== '_continue')
    ).toString();

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const baseUrl = `${protocol}://${host}`;

    const html = generatePreviewHtml({
      slug,
      linkConfig,
      queryString,
      baseUrl,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(html);
  }

  // Platform detection
  const platformInfo = getPlatformInfo(userAgent);
  const platform = platformInfo.platform;

  // Build redirect URL
  const redirectParams: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    redirectParams[key] = typeof value === 'string' ? value : undefined;
  }

  const result = buildRedirectUrl(platform, linkConfig, redirectParams, ALLOWED_HOSTS);

  if (!result.isValid) {
    console.error(JSON.stringify({
      event: 'redirect_error',
      slug,
      platform,
      error: result.error,
    }));

    if (result.error?.includes('Phone number is required')) {
      return res.status(400).json({
        error: 'Phone number is required',
        message: 'Please provide a phone number via the "phone" query parameter',
      });
    }

    return res.status(500).json({
      error: 'Failed to build redirect URL',
      message: result.error,
    });
  }

  // Log redirect
  console.log(JSON.stringify({
    event: 'redirect',
    slug,
    platform,
    browser: platformInfo.browser,
    os: platformInfo.os,
    hashedIp: hashIP(req.headers['x-forwarded-for'] as string),
    targetHost: new URL(result.url).hostname,
  }));

  // Perform redirect
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.redirect(302, result.url);
}

function handlePreview(req: VercelRequest, res: VercelResponse, slug: string) {
  const linkConfig = (linksConfig as Record<string, any>)[slug];

  if (!linkConfig) {
    return res.status(404).json({
      error: 'Link not found',
      slug,
    });
  }

  const query = req.query as Record<string, string>;
  const queryString = new URLSearchParams(query).toString();

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const baseUrl = `${protocol}://${host}`;

  const html = generatePreviewHtml({
    slug,
    linkConfig,
    queryString,
    baseUrl,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(html);
}
