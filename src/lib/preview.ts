import type { LinkEntry } from '../config.js';

export interface PreviewOptions {
  slug: string;
  linkConfig: LinkEntry;
  queryString: string;
  baseUrl: string;
}

/**
 * Generates the HTML preview page for bot/crawler requests.
 * Includes OpenGraph meta tags for rich link previews and a continue button.
 */
export function generatePreviewHtml(options: PreviewOptions): string {
  const { slug, linkConfig, queryString, baseUrl } = options;

  const ogTitle = linkConfig.ogTitle || 'Continue to WhatsApp';
  const ogDescription =
    linkConfig.ogDescription || 'Click to continue to your destination';
  const ogImage = linkConfig.ogImage || '';

  // Build the redirect URL for the continue button
  const redirectPath = `/r/${slug}${queryString ? `?${queryString}` : ''}`;
  const fullRedirectUrl = `${baseUrl}${redirectPath}`;

  // Add a special param to bypass bot detection for the actual redirect
  const continueUrl = `${redirectPath}${queryString ? '&' : '?'}_continue=1`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)}</title>

  <!-- OpenGraph Meta Tags -->
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(fullRedirectUrl)}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ''}

  <!-- Security Headers via meta -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff">

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    }

    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #25D366;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon svg {
      width: 48px;
      height: 48px;
      fill: white;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
    }

    p {
      font-size: 16px;
      color: #666;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .continue-btn {
      display: inline-block;
      background: #25D366;
      color: white;
      text-decoration: none;
      padding: 16px 48px;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      border: none;
    }

    .continue-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
    }

    .continue-btn:active {
      transform: translateY(0);
    }

    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </div>

    <h1>${escapeHtml(ogTitle)}</h1>
    <p>${escapeHtml(ogDescription)}</p>

    <a href="${escapeHtml(continueUrl)}" class="continue-btn" id="continueBtn">
      Continue
    </a>

    <p class="footer">You will be redirected to WhatsApp</p>
  </div>

  <noscript>
    <style>
      .container { display: none; }
    </style>
    <div class="container" style="display: block;">
      <h1>${escapeHtml(ogTitle)}</h1>
      <p>${escapeHtml(ogDescription)}</p>
      <a href="${escapeHtml(continueUrl)}" class="continue-btn">Continue</a>
    </div>
  </noscript>

  <script>
    // Auto-redirect after a short delay for non-bot users who land here directly
    // This handles cases where JS is enabled but user somehow got the preview page
    document.getElementById('continueBtn').addEventListener('click', function(e) {
      // Allow the default link behavior
    });
  </script>
</body>
</html>`;
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
