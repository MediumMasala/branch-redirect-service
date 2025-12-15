import { describe, it, expect } from 'vitest';
import { isBot, identifyBot } from '../src/lib/isBot.js';

describe('Bot Detection', () => {
  describe('isBot', () => {
    describe('Social media bots', () => {
      it('should detect LinkedInBot', () => {
        const ua = 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Twitterbot', () => {
        const ua = 'Twitterbot/1.0';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect facebookexternalhit', () => {
        const ua = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Facebot', () => {
        const ua = 'Facebot';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Slackbot', () => {
        const ua = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Discordbot', () => {
        const ua = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect WhatsApp', () => {
        const ua = 'WhatsApp/2.23.20.11 A';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect TelegramBot', () => {
        const ua = 'TelegramBot (like TwitterBot)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Pinterest', () => {
        const ua = 'Pinterest/0.2 (+https://www.pinterest.com/bot.html)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Redditbot', () => {
        const ua = 'Redditbot/1.0';
        expect(isBot(ua)).toBe(true);
      });
    });

    describe('Search engine bots', () => {
      it('should detect Googlebot', () => {
        const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect bingbot', () => {
        const ua = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect Baiduspider', () => {
        const ua = 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect YandexBot', () => {
        const ua = 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect DuckDuckBot', () => {
        const ua = 'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)';
        expect(isBot(ua)).toBe(true);
      });
    });

    describe('Apple bots', () => {
      it('should detect Applebot', () => {
        const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)';
        expect(isBot(ua)).toBe(true);
      });

      it('should detect iMessageLinkPreviews', () => {
        const ua = 'iMessageLinkPreviews/1.0';
        expect(isBot(ua)).toBe(true);
      });
    });

    describe('Non-bot user agents', () => {
      it('should NOT detect regular Chrome browser', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
        expect(isBot(ua)).toBe(false);
      });

      it('should NOT detect regular Safari browser', () => {
        const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
        expect(isBot(ua)).toBe(false);
      });

      it('should NOT detect regular Firefox browser', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0';
        expect(isBot(ua)).toBe(false);
      });

      it('should NOT detect mobile Safari', () => {
        const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
        expect(isBot(ua)).toBe(false);
      });

      it('should NOT detect Android Chrome', () => {
        const ua = 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
        expect(isBot(ua)).toBe(false);
      });

      it('should return false for undefined UA', () => {
        expect(isBot(undefined)).toBe(false);
      });

      it('should return false for empty UA', () => {
        expect(isBot('')).toBe(false);
      });
    });
  });

  describe('identifyBot', () => {
    it('should identify Googlebot', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      expect(identifyBot(ua)).toBe('Googlebot');
    });

    it('should identify facebookexternalhit', () => {
      const ua = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
      expect(identifyBot(ua)).toBe('facebookexternalhit');
    });

    it('should return null for non-bot UA', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
      expect(identifyBot(ua)).toBe(null);
    });

    it('should return null for undefined UA', () => {
      expect(identifyBot(undefined)).toBe(null);
    });
  });
});
