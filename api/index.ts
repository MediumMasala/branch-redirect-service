import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

// Google Sheets Analytics
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwgRcn7bQJh1XM_GOPHSE8b5-eX8UX5SS3Y-rDpHG37wmeeciEGHBUKiBFZDuudHlshpA/exec';

async function logToSheet(data: {
  slug: string;
  platform: string;
  referer: string;
  utm_source: string;
  utm_campaign: string;
}) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to log to sheet:', error);
  }
}

// Inline config to avoid import issues
const linksConfig: Record<string, LinkConfig> = {
  "grapevine": {
    "androidFlowUrl": "https://mediummasala.github.io/linkedin-whatsapp-redirect/",
    "iosWhatsappBaseUrl": "https://wa.me/",
    "desktopWhatsappBaseUrl": "https://wa.me/",
    "defaultPhone": "919606047104",
    "defaultText": "Hi Tal, count me in!",
    "ogTitle": "Chat with Us on WhatsApp",
    "ogDescription": "Start a conversation instantly via WhatsApp",
    "ogImage": "https://example.com/og-image.png"
  }
};

interface LinkConfig {
  androidFlowUrl: string;
  iosWhatsappBaseUrl: string;
  desktopWhatsappBaseUrl: string;
  defaultPhone?: string;
  defaultText?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

const ALLOWED_HOSTS = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'mediummasala.github.io'
]);

// Platform detection
type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(userAgent: string | undefined): Platform {
  if (!userAgent) return 'desktop';
  if (/(iPhone|iPad|iPod)/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

// Bot detection
const BOT_PATTERNS = [
  /LinkedInBot/i, /Twitterbot/i, /facebookexternalhit/i, /Facebot/i,
  /Slackbot/i, /Discordbot/i, /WhatsApp/i, /TelegramBot/i,
  /Googlebot/i, /bingbot/i, /Applebot/i, /Pinterest/i
];

function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// Hash IP
function hashIP(ip: string | undefined): string {
  if (!ip) return 'unknown';
  return createHash('sha256').update(`salt:${ip}`).digest('hex').substring(0, 16);
}

// Build WhatsApp URL
function buildWhatsAppUrl(baseUrl: string, phone: string, text: string): string {
  const url = new URL(baseUrl);
  const host = url.hostname.toLowerCase();

  if (host === 'wa.me') {
    url.pathname = `/${phone}`;
    url.searchParams.set('text', text);
  } else {
    url.pathname = '/send';
    url.searchParams.set('phone', phone);
    url.searchParams.set('text', text);
  }

  return url.toString();
}

// Generate preview HTML
function generatePreviewHtml(slug: string, config: LinkConfig, queryString: string, baseUrl: string): string {
  const ogTitle = config.ogTitle || 'Continue to WhatsApp';
  const ogDescription = config.ogDescription || 'Click to continue';
  const ogImage = config.ogImage || '';
  const continueUrl = `/r/${slug}${queryString ? `?${queryString}&` : '?'}_continue=1`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:type" content="website">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <style>
    body { font-family: -apple-system, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
    .container { background: white; border-radius: 16px; padding: 48px; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #666; margin-bottom: 32px; }
    .btn { display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 18px; font-weight: 600; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,211,102,0.4); }
  </style>
</head>
<body>
  <div class="container">
    <h1>${ogTitle}</h1>
    <p>${ogDescription}</p>
    <a href="${continueUrl}" class="btn">Continue</a>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const path = req.url?.split('?')[0] || '';

  // Health check
  if (path === '/health' || path === '/api/health' || path === '/api') {
    return res.status(200).send('ok');
  }

  // Extract slug
  const match = path.match(/^\/(?:api\/)?r\/([^\/]+)$/);
  if (!match) {
    return res.status(404).json({ error: 'Not Found' });
  }

  const slug = match[1] as string;
  const config = linksConfig[slug];

  if (!config) {
    return res.status(404).json({ error: 'Link not found', slug });
  }

  const userAgent = req.headers['user-agent'] as string | undefined;
  const query = req.query as Record<string, string>;

  // Bot handling
  if (isBot(userAgent) && query._continue !== '1') {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([k]) => k !== '_continue')
    ).toString();

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const html = generatePreviewHtml(slug, config, qs, `${protocol}://${host}`);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  // Get phone and text
  const phone = query.phone || config.defaultPhone;
  const text = query.text || config.defaultText || '';

  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  // Detect platform and build URL
  const platform = detectPlatform(userAgent);
  let targetUrl: string;

  if (platform === 'android') {
    const url = new URL(config.androidFlowUrl);
    url.searchParams.set('phone', phone);
    url.searchParams.set('text', text);
    // Pass through UTM params
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('utm_') && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }
    targetUrl = url.toString();
  } else if (platform === 'ios') {
    targetUrl = buildWhatsAppUrl(config.iosWhatsappBaseUrl, phone, text);
  } else {
    targetUrl = buildWhatsAppUrl(config.desktopWhatsappBaseUrl, phone, text);
  }

  // Validate host
  const targetHost = new URL(targetUrl).hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(targetHost)) {
    return res.status(500).json({ error: 'Redirect host not allowed' });
  }

  // Log to Google Sheet (non-blocking)
  const referer = req.headers['referer'] || req.headers['referrer'] || '';
  logToSheet({
    slug,
    platform,
    referer: typeof referer === 'string' ? referer : '',
    utm_source: query.utm_source || '',
    utm_campaign: query.utm_campaign || '',
  });

  // Redirect
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.redirect(302, targetUrl);
}
