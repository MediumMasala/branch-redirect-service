import { describe, it, expect } from 'vitest';
import { detectPlatform, getPlatformInfo } from '../src/lib/platform.js';

describe('Platform Detection', () => {
  describe('detectPlatform', () => {
    describe('iOS detection', () => {
      it('should detect iPhone', () => {
        const ua =
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
        expect(detectPlatform(ua)).toBe('ios');
      });

      it('should detect iPad', () => {
        const ua =
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
        expect(detectPlatform(ua)).toBe('ios');
      });

      it('should detect iPod', () => {
        const ua =
          'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
        expect(detectPlatform(ua)).toBe('ios');
      });

      it('should detect iPadOS (reports as iPad)', () => {
        const ua =
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
        expect(detectPlatform(ua)).toBe('ios');
      });
    });

    describe('Android detection', () => {
      it('should detect Android phone', () => {
        const ua =
          'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
        expect(detectPlatform(ua)).toBe('android');
      });

      it('should detect Android tablet', () => {
        const ua =
          'Mozilla/5.0 (Linux; Android 12; SM-X906C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36';
        expect(detectPlatform(ua)).toBe('android');
      });

      it('should detect Android with various browsers', () => {
        const firefoxAndroid =
          'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/119.0';
        expect(detectPlatform(firefoxAndroid)).toBe('android');

        const operaAndroid =
          'Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36 OPR/73.0.0';
        expect(detectPlatform(operaAndroid)).toBe('android');
      });
    });

    describe('Desktop detection (fallback)', () => {
      it('should detect Windows Chrome as desktop', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
        expect(detectPlatform(ua)).toBe('desktop');
      });

      it('should detect macOS Safari as desktop', () => {
        const ua =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
        expect(detectPlatform(ua)).toBe('desktop');
      });

      it('should detect macOS Chrome as desktop', () => {
        const ua =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
        expect(detectPlatform(ua)).toBe('desktop');
      });

      it('should detect Linux Firefox as desktop', () => {
        const ua =
          'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0';
        expect(detectPlatform(ua)).toBe('desktop');
      });

      it('should return desktop for empty UA', () => {
        expect(detectPlatform('')).toBe('desktop');
      });

      it('should return desktop for undefined UA', () => {
        expect(detectPlatform(undefined)).toBe('desktop');
      });
    });
  });

  describe('getPlatformInfo', () => {
    it('should return detailed platform info for iPhone', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      const info = getPlatformInfo(ua);

      expect(info.platform).toBe('ios');
      expect(info.os).toBe('iOS');
      expect(info.browser).toBe('Mobile Safari');
    });

    it('should return detailed platform info for Android', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
      const info = getPlatformInfo(ua);

      expect(info.platform).toBe('android');
      expect(info.os).toBe('Android');
      expect(info.browser).toBe('Chrome');
    });

    it('should handle undefined UA gracefully', () => {
      const info = getPlatformInfo(undefined);

      expect(info.platform).toBe('desktop');
      expect(info.browser).toBeUndefined();
      expect(info.os).toBeUndefined();
    });
  });
});
