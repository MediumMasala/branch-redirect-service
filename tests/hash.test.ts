import { describe, it, expect } from 'vitest';
import { hashIP } from '../src/lib/hash.js';

describe('Hash Utilities', () => {
  describe('hashIP', () => {
    it('should produce consistent hash for same IP', () => {
      const hash1 = hashIP('192.168.1.1');
      const hash2 = hashIP('192.168.1.1');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different IPs', () => {
      const hash1 = hashIP('192.168.1.1');
      const hash2 = hashIP('192.168.1.2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return truncated hash (16 characters)', () => {
      const hash = hashIP('192.168.1.1');
      expect(hash).toHaveLength(16);
    });

    it('should return "unknown" for undefined IP', () => {
      const hash = hashIP(undefined);
      expect(hash).toBe('unknown');
    });

    it('should handle IPv6 addresses', () => {
      const hash = hashIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(hash).toHaveLength(16);
    });

    it('should use custom salt if provided', () => {
      const hash1 = hashIP('192.168.1.1', 'salt1');
      const hash2 = hashIP('192.168.1.1', 'salt2');
      expect(hash1).not.toBe(hash2);
    });
  });
});
