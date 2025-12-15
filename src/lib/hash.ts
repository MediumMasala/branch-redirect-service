import { createHash } from 'crypto';

/**
 * Creates a one-way hash of an IP address for logging purposes.
 * This allows tracking unique visitors without storing PII.
 *
 * @param ip - The IP address to hash
 * @param salt - Optional salt for additional security (defaults to a static value)
 * @returns A hashed representation of the IP
 */
export function hashIP(ip: string | undefined, salt = 'branch-redirect-salt'): string {
  if (!ip) {
    return 'unknown';
  }

  // Use SHA-256 for a secure one-way hash
  const hash = createHash('sha256');
  hash.update(`${salt}:${ip}`);
  return hash.digest('hex').substring(0, 16); // First 16 chars is enough for uniqueness
}
