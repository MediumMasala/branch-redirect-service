/**
 * List of known bot/crawler User-Agent patterns.
 * These are social media link preview bots and search engine crawlers.
 */
const BOT_PATTERNS = [
  // Social media bots
  /LinkedInBot/i,
  /Twitterbot/i,
  /facebookexternalhit/i,
  /Facebot/i,
  /Slackbot/i,
  /Discordbot/i,
  /WhatsApp/i,
  /TelegramBot/i,
  /Viber/i,
  /SkypeUriPreview/i,
  /Pinterest/i,
  /Redditbot/i,
  /Embedly/i,

  // Search engine bots
  /Googlebot/i,
  /bingbot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /DuckDuckBot/i,
  /Sogou/i,

  // Preview/unfurl services
  /Slurp/i, // Yahoo
  /ia_archiver/i, // Alexa
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /rogerbot/i,
  /PetalBot/i,

  // Generic preview fetchers
  /preview/i,
  /crawler/i,
  /spider/i,
  /bot\b/i, // Match 'bot' as a word boundary

  // App preview fetchers
  /Applebot/i,
  /iMessageLinkPreviews/i,
];

/**
 * Checks if a User-Agent string belongs to a known bot/crawler.
 * Used to serve preview pages instead of redirects to social media bots.
 *
 * @param userAgent - The User-Agent header string
 * @returns true if the UA matches a known bot pattern
 */
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) {
    return false;
  }

  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Identifies which bot matched (useful for logging/debugging).
 *
 * @param userAgent - The User-Agent header string
 * @returns The matched bot pattern or null
 */
export function identifyBot(userAgent: string | undefined): string | null {
  if (!userAgent) {
    return null;
  }

  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      // Extract the bot name from the pattern
      const match = userAgent.match(pattern);
      return match ? match[0] : pattern.source;
    }
  }

  return null;
}
