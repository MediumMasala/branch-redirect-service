import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { healthRoutes } from '../src/routes/health.js';
import { redirectRoutes } from '../src/routes/redirect.js';

// Mock the config modules
import { vi } from 'vitest';

// Set up environment before importing config
process.env.ALLOWED_HOSTS = 'wa.me,api.whatsapp.com,web.whatsapp.com,flow.example.com';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

describe('Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(healthRoutes);
    await app.register(redirectRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Routes', () => {
    it('GET /health should return 200 ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('ok');
    });

    it('GET /health/ready should return ready status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ready');
      expect(body).toHaveProperty('timestamp');
    });

    it('GET /health/live should return live status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('live');
    });
  });

  describe('Redirect Routes', () => {
    describe('GET /r/:slug', () => {
      it('should redirect iOS user-agent to WhatsApp', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          },
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('wa.me');
      });

      it('should redirect Android user-agent to flow URL', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36',
          },
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('flow.example.com');
      });

      it('should redirect desktop user-agent to web WhatsApp', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
          },
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('web.whatsapp.com');
      });

      it('should preserve UTM params in redirect', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo?utm_source=test&utm_campaign=demo',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('utm_source=test');
        expect(response.headers.location).toContain('utm_campaign=demo');
      });

      it('should override default phone with query param', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo?phone=918888888888',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('918888888888');
      });

      it('should override default text with query param', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo?text=Custom%20message',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('text=Custom');
      });

      it('should return 404 for unknown slug', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/nonexistent',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Link not found');
      });
    });

    describe('Bot handling', () => {
      it('should return preview HTML for Googlebot', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent':
              'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.body).toContain('og:title');
        expect(response.body).toContain('Continue');
      });

      it('should return preview HTML for facebookexternalhit', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent':
              'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('og:title');
      });

      it('should return preview HTML for Twitterbot', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent': 'Twitterbot/1.0',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('og:title');
      });

      it('should return preview HTML for LinkedInBot', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent': 'LinkedInBot/1.0',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('og:title');
      });

      it('should return preview HTML for Slackbot', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent': 'Slackbot-LinkExpanding 1.0',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('og:title');
      });

      it('should return preview HTML for WhatsApp preview', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo',
          headers: {
            'user-agent': 'WhatsApp/2.23.20.11',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('og:title');
      });

      it('should redirect bot when _continue=1 is set', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/r/demo?_continue=1',
          headers: {
            'user-agent':
              'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          },
        });

        expect(response.statusCode).toBe(302);
      });
    });

    describe('GET /preview/:slug', () => {
      it('should return preview HTML for any user', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/preview/demo',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.body).toContain('og:title');
        expect(response.body).toContain('Chat with Us on WhatsApp');
      });

      it('should include custom OG tags from config', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/preview/support',
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Contact Support');
        expect(response.body).toContain('Get help from our support team');
      });

      it('should return 404 for unknown slug', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/preview/nonexistent',
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });
});
