import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppUrl,
  buildAndroidFlowUrl,
  buildRedirectUrl,
  extractPassthroughParams,
  isHostAllowed,
} from '../src/lib/urlBuilder.js';
import type { LinkEntry } from '../src/config.js';

describe('URL Builder', () => {
  describe('buildWhatsAppUrl', () => {
    describe('wa.me format', () => {
      it('should build wa.me URL with phone and text', () => {
        const url = buildWhatsAppUrl('https://wa.me/', '919999999999', 'Hello World');
        expect(url).toBe('https://wa.me/919999999999?text=Hello+World');
      });

      it('should handle wa.me URL with existing phone in path', () => {
        const url = buildWhatsAppUrl('https://wa.me/919999999999', '919999999999', 'Test message');
        expect(url).toBe('https://wa.me/919999999999?text=Test+message');
      });

      it('should URL-encode special characters in text', () => {
        const url = buildWhatsAppUrl('https://wa.me/', '919999999999', 'Hello! How are you? 😊');
        expect(url).toContain('text=Hello%21+How+are+you%3F+%F0%9F%98%8A');
      });

      it('should append passthrough params', () => {
        const url = buildWhatsAppUrl(
          'https://wa.me/',
          '919999999999',
          'Hello',
          { utm_source: 'test', utm_campaign: 'demo' }
        );
        expect(url).toContain('utm_source=test');
        expect(url).toContain('utm_campaign=demo');
      });
    });

    describe('api.whatsapp.com format', () => {
      it('should build api.whatsapp.com URL with phone and text', () => {
        const url = buildWhatsAppUrl(
          'https://api.whatsapp.com/send',
          '919999999999',
          'Hello World'
        );
        expect(url).toBe('https://api.whatsapp.com/send?phone=919999999999&text=Hello+World');
      });

      it('should handle URL without /send path', () => {
        const url = buildWhatsAppUrl(
          'https://api.whatsapp.com/',
          '919999999999',
          'Test message'
        );
        expect(url).toBe('https://api.whatsapp.com/send?phone=919999999999&text=Test+message');
      });

      it('should preserve existing query params', () => {
        const url = buildWhatsAppUrl(
          'https://api.whatsapp.com/send?existing=param',
          '919999999999',
          'Hello'
        );
        expect(url).toContain('existing=param');
        expect(url).toContain('phone=919999999999');
        expect(url).toContain('text=Hello');
      });
    });

    describe('web.whatsapp.com format', () => {
      it('should build web.whatsapp.com URL with phone and text', () => {
        const url = buildWhatsAppUrl(
          'https://web.whatsapp.com/send',
          '919999999999',
          'Hello World'
        );
        expect(url).toBe('https://web.whatsapp.com/send?phone=919999999999&text=Hello+World');
      });

      it('should handle URL without /send path', () => {
        const url = buildWhatsAppUrl(
          'https://web.whatsapp.com/',
          '919999999999',
          'Test message'
        );
        expect(url).toBe('https://web.whatsapp.com/send?phone=919999999999&text=Test+message');
      });
    });

    describe('URL encoding', () => {
      it('should properly encode ampersands', () => {
        const url = buildWhatsAppUrl('https://wa.me/', '919999999999', 'Hello & Goodbye');
        expect(url).toContain('text=Hello+%26+Goodbye');
      });

      it('should properly encode newlines', () => {
        const url = buildWhatsAppUrl('https://wa.me/', '919999999999', 'Line 1\nLine 2');
        expect(url).toContain('text=Line+1%0ALine+2');
      });

      it('should properly encode URLs in text', () => {
        const url = buildWhatsAppUrl('https://wa.me/', '919999999999', 'Check this: https://example.com');
        expect(url).toContain('text=Check+this%3A+https%3A%2F%2Fexample.com');
      });
    });
  });

  describe('buildAndroidFlowUrl', () => {
    it('should build Android flow URL with all params', () => {
      const url = buildAndroidFlowUrl(
        'https://flow.example.com/android',
        '919999999999',
        'Hello World'
      );
      expect(url).toBe('https://flow.example.com/android?phone=919999999999&text=Hello+World');
    });

    it('should append passthrough params', () => {
      const url = buildAndroidFlowUrl(
        'https://flow.example.com/android',
        '919999999999',
        'Hello',
        { utm_source: 'test', utm_campaign: 'demo', custom_param: 'value' }
      );
      expect(url).toContain('utm_source=test');
      expect(url).toContain('utm_campaign=demo');
      expect(url).toContain('custom_param=value');
    });

    it('should preserve existing query params from base URL', () => {
      const url = buildAndroidFlowUrl(
        'https://flow.example.com/android?existing=param',
        '919999999999',
        'Hello'
      );
      expect(url).toContain('existing=param');
      expect(url).toContain('phone=919999999999');
    });
  });

  describe('extractPassthroughParams', () => {
    it('should extract UTM params', () => {
      const params = extractPassthroughParams({
        phone: '919999999999',
        text: 'Hello',
        utm_source: 'test',
        utm_campaign: 'demo',
        utm_medium: 'social',
      });

      expect(params).toEqual({
        utm_source: 'test',
        utm_campaign: 'demo',
        utm_medium: 'social',
      });
    });

    it('should exclude phone and text', () => {
      const params = extractPassthroughParams({
        phone: '919999999999',
        text: 'Hello',
        custom: 'value',
      });

      expect(params).not.toHaveProperty('phone');
      expect(params).not.toHaveProperty('text');
      expect(params).toHaveProperty('custom', 'value');
    });

    it('should filter out undefined and empty values', () => {
      const params = extractPassthroughParams({
        phone: '919999999999',
        valid: 'value',
        empty: '',
        undef: undefined,
      });

      expect(params).toEqual({ valid: 'value' });
    });
  });

  describe('isHostAllowed', () => {
    const allowedHosts = new Set(['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'flow.example.com']);

    it('should return true for allowed hosts', () => {
      expect(isHostAllowed('https://wa.me/919999999999', allowedHosts)).toBe(true);
      expect(isHostAllowed('https://api.whatsapp.com/send', allowedHosts)).toBe(true);
      expect(isHostAllowed('https://web.whatsapp.com/send', allowedHosts)).toBe(true);
      expect(isHostAllowed('https://flow.example.com/path', allowedHosts)).toBe(true);
    });

    it('should return false for disallowed hosts', () => {
      expect(isHostAllowed('https://evil.com/redirect', allowedHosts)).toBe(false);
      expect(isHostAllowed('https://malicious.example.com', allowedHosts)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isHostAllowed('https://WA.ME/919999999999', allowedHosts)).toBe(true);
      expect(isHostAllowed('https://API.WHATSAPP.COM/send', allowedHosts)).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isHostAllowed('not-a-url', allowedHosts)).toBe(false);
      expect(isHostAllowed('', allowedHosts)).toBe(false);
    });
  });

  describe('buildRedirectUrl', () => {
    const allowedHosts = new Set(['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'flow.example.com']);

    const linkConfig: LinkEntry = {
      androidFlowUrl: 'https://flow.example.com/android',
      iosWhatsappBaseUrl: 'https://wa.me/',
      desktopWhatsappBaseUrl: 'https://web.whatsapp.com/send',
      defaultPhone: '919999999999',
      defaultText: 'Default message',
    };

    describe('iOS redirects', () => {
      it('should build iOS redirect URL with defaults', () => {
        const result = buildRedirectUrl('ios', linkConfig, {}, allowedHosts);

        expect(result.isValid).toBe(true);
        expect(result.url).toContain('wa.me');
        expect(result.url).toContain('919999999999');
        expect(result.url).toContain('text=Default+message');
      });

      it('should override defaults with query params', () => {
        const result = buildRedirectUrl(
          'ios',
          linkConfig,
          { phone: '918888888888', text: 'Custom message' },
          allowedHosts
        );

        expect(result.isValid).toBe(true);
        expect(result.url).toContain('918888888888');
        expect(result.url).toContain('text=Custom+message');
      });
    });

    describe('Android redirects', () => {
      it('should build Android redirect URL', () => {
        const result = buildRedirectUrl('android', linkConfig, {}, allowedHosts);

        expect(result.isValid).toBe(true);
        expect(result.url).toContain('flow.example.com');
        expect(result.url).toContain('phone=919999999999');
        expect(result.url).toContain('text=Default+message');
      });

      it('should include UTM params in Android URL', () => {
        const result = buildRedirectUrl(
          'android',
          linkConfig,
          { utm_source: 'test', utm_campaign: 'demo' },
          allowedHosts
        );

        expect(result.isValid).toBe(true);
        expect(result.url).toContain('utm_source=test');
        expect(result.url).toContain('utm_campaign=demo');
      });
    });

    describe('Desktop redirects', () => {
      it('should build desktop redirect URL', () => {
        const result = buildRedirectUrl('desktop', linkConfig, {}, allowedHosts);

        expect(result.isValid).toBe(true);
        expect(result.url).toContain('web.whatsapp.com');
        expect(result.url).toContain('phone=919999999999');
        expect(result.url).toContain('text=Default+message');
      });
    });

    describe('Error cases', () => {
      it('should fail when no phone is provided and no default', () => {
        const configNoDefault: LinkEntry = {
          ...linkConfig,
          defaultPhone: undefined,
        };

        const result = buildRedirectUrl('ios', configNoDefault, {}, allowedHosts);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Phone number is required');
      });

      it('should fail when redirect host is not allowed', () => {
        const configBadHost: LinkEntry = {
          ...linkConfig,
          androidFlowUrl: 'https://evil.com/redirect',
        };

        const result = buildRedirectUrl('android', configBadHost, {}, allowedHosts);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not allowed');
      });
    });
  });
});
