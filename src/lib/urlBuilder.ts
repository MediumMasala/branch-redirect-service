import type { Platform } from './platform.js';
import type { LinkEntry } from '../config.js';

export interface RedirectParams {
  phone?: string;
  text?: string;
  [key: string]: string | undefined;
}

export interface BuildUrlResult {
  url: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extracts UTM and other passthrough parameters from query params.
 * Excludes phone and text as they're handled separately.
 */
export function extractPassthroughParams(
  params: Record<string, string | undefined>
): Record<string, string> {
  const passthrough: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    // Skip phone and text - they're handled separately
    if (key === 'phone' || key === 'text') {
      continue;
    }
    // Include all other params (utm_*, custom params, etc.)
    if (value !== undefined && value !== '') {
      passthrough[key] = value;
    }
  }

  return passthrough;
}

/**
 * Safely appends query parameters to a URL.
 * Handles URLs that may already have query parameters.
 */
export function appendQueryParams(
  baseUrl: string,
  params: Record<string, string>
): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    // Don't override existing params from baseUrl
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Builds a WhatsApp URL (wa.me, api.whatsapp.com, or web.whatsapp.com format).
 * Handles all three URL formats correctly.
 *
 * Supported formats:
 * - https://wa.me/<phone>?text=<encoded>
 * - https://api.whatsapp.com/send?phone=<phone>&text=<encoded>
 * - https://web.whatsapp.com/send?phone=<phone>&text=<encoded>
 */
export function buildWhatsAppUrl(
  baseUrl: string,
  phone: string,
  text: string,
  passthroughParams: Record<string, string> = {}
): string {
  const url = new URL(baseUrl);
  const host = url.hostname.toLowerCase();

  // Encode the text properly for WhatsApp
  const encodedText = text;

  if (host === 'wa.me') {
    // wa.me format: https://wa.me/<phone>?text=<encoded>
    // Ensure phone is in the path
    if (!url.pathname.match(/\/\d+/)) {
      url.pathname = `/${phone}`;
    }
    url.searchParams.set('text', encodedText);
  } else if (host === 'api.whatsapp.com' || host === 'web.whatsapp.com') {
    // API/Web format: https://[api|web].whatsapp.com/send?phone=<phone>&text=<encoded>
    if (!url.pathname.includes('/send')) {
      url.pathname = '/send';
    }
    url.searchParams.set('phone', phone);
    url.searchParams.set('text', encodedText);
  } else {
    // Unknown WhatsApp-like URL, try to handle generically
    url.searchParams.set('phone', phone);
    url.searchParams.set('text', encodedText);
  }

  // Add passthrough params (utm_* etc.) - WhatsApp will ignore them but they're useful for tracking
  for (const [key, value] of Object.entries(passthroughParams)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Builds an Android flow URL with all params appended.
 */
export function buildAndroidFlowUrl(
  baseUrl: string,
  phone: string,
  text: string,
  passthroughParams: Record<string, string> = {}
): string {
  const url = new URL(baseUrl);

  url.searchParams.set('phone', phone);
  url.searchParams.set('text', text);

  // Add all passthrough params
  for (const [key, value] of Object.entries(passthroughParams)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Validates that a URL's hostname is in the allowed hosts list.
 */
export function isHostAllowed(url: string, allowedHosts: Set<string>): boolean {
  try {
    const parsed = new URL(url);
    return allowedHosts.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Main function to build the redirect URL based on platform.
 */
export function buildRedirectUrl(
  platform: Platform,
  linkConfig: LinkEntry,
  params: RedirectParams,
  allowedHosts: Set<string>
): BuildUrlResult {
  // Resolve phone (query param overrides default)
  const phone = params.phone || linkConfig.defaultPhone;
  if (!phone) {
    return {
      url: '',
      isValid: false,
      error: 'Phone number is required but not provided',
    };
  }

  // Resolve text (query param overrides default)
  const text = params.text || linkConfig.defaultText || '';

  // Extract passthrough params (utm_* etc.)
  const passthroughParams = extractPassthroughParams(params);

  let targetUrl: string;

  switch (platform) {
    case 'ios':
      targetUrl = buildWhatsAppUrl(
        linkConfig.iosWhatsappBaseUrl,
        phone,
        text,
        passthroughParams
      );
      break;

    case 'android':
      targetUrl = buildAndroidFlowUrl(
        linkConfig.androidFlowUrl,
        phone,
        text,
        passthroughParams
      );
      break;

    case 'desktop':
    default:
      targetUrl = buildWhatsAppUrl(
        linkConfig.desktopWhatsappBaseUrl,
        phone,
        text,
        passthroughParams
      );
      break;
  }

  // Validate the target URL hostname
  if (!isHostAllowed(targetUrl, allowedHosts)) {
    return {
      url: '',
      isValid: false,
      error: `Redirect to host not allowed: ${new URL(targetUrl).hostname}`,
    };
  }

  return {
    url: targetUrl,
    isValid: true,
  };
}
