import UAParser from 'ua-parser-js';

export type Platform = 'ios' | 'android' | 'desktop';

// Regular expressions for platform detection
const ANDROID_REGEX = /Android/i;
const IOS_REGEX = /(iPhone|iPad|iPod)/i;

/**
 * Detects the platform from a User-Agent string.
 * Priority: iOS > Android > Desktop (fallback)
 *
 * @param userAgent - The User-Agent header string
 * @returns The detected platform
 */
export function detectPlatform(userAgent: string | undefined): Platform {
  if (!userAgent) {
    return 'desktop';
  }

  // Check for iOS devices first (including iPadOS which reports as iPad)
  if (IOS_REGEX.test(userAgent)) {
    return 'ios';
  }

  // Check for Android devices
  if (ANDROID_REGEX.test(userAgent)) {
    return 'android';
  }

  // Fallback to desktop for everything else
  return 'desktop';
}

/**
 * Extended platform info using ua-parser-js for detailed device info.
 * Useful for logging and analytics.
 */
export interface PlatformInfo {
  platform: Platform;
  browser: string | undefined;
  browserVersion: string | undefined;
  os: string | undefined;
  osVersion: string | undefined;
  device: string | undefined;
  deviceType: string | undefined;
}

export function getPlatformInfo(userAgent: string | undefined): PlatformInfo {
  const platform = detectPlatform(userAgent);

  if (!userAgent) {
    return {
      platform,
      browser: undefined,
      browserVersion: undefined,
      os: undefined,
      osVersion: undefined,
      device: undefined,
      deviceType: undefined,
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    platform,
    browser: result.browser.name,
    browserVersion: result.browser.version,
    os: result.os.name,
    osVersion: result.os.version,
    device: result.device.model,
    deviceType: result.device.type,
  };
}
