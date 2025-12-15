# Branch Redirect Service

A production-ready URL redirection service that detects device type (iOS, Android, Desktop) and redirects users to platform-appropriate destinations. Similar to Branch.io's deep linking functionality.

## Features

- **Platform Detection**: Automatically detects iOS, Android, and Desktop based on User-Agent
- **Smart Redirects**: Routes users to platform-specific URLs (WhatsApp native, WhatsApp web, custom flows)
- **Bot/Crawler Handling**: Serves OpenGraph-rich preview pages to social media bots (Facebook, Twitter, LinkedIn, Slack, etc.)
- **Security**: Allowlisted redirect hosts, rate limiting, security headers, IP hashing (never stores raw IPs)
- **UTM Preservation**: Forwards all `utm_*` and custom query parameters
- **Production Ready**: JSON logging, health checks, graceful shutdown

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
cd /path/to/branch-redirect-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed redirect hostnames | `wa.me,api.whatsapp.com,web.whatsapp.com` |
| `RATE_LIMIT_MAX` | Max requests per IP per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` |
| `LOG_LEVEL` | Logging level (trace, debug, info, warn, error, fatal) | `info` |
| `NODE_ENV` | Environment (development, production, test) | `production` |

### Adding a New Slug

Edit `config/links.json`:

```json
{
  "my-new-link": {
    "androidFlowUrl": "https://your-android-flow.com/path",
    "iosWhatsappBaseUrl": "https://wa.me/",
    "desktopWhatsappBaseUrl": "https://web.whatsapp.com/send",
    "defaultPhone": "919999999999",
    "defaultText": "Hello from my link!",
    "ogTitle": "My Link Title",
    "ogDescription": "Description for social previews",
    "ogImage": "https://example.com/og-image.png"
  }
}
```

**Important**: Make sure any new redirect hosts are added to `ALLOWED_HOSTS` in your environment.

## API Endpoints

### Health Check

```
GET /health
```

Returns `200 ok` for load balancer health checks.

### Redirect

```
GET /r/:slug
```

Main redirect endpoint. Detects platform and redirects appropriately.

**Query Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `phone` | Phone number (overrides default) | `919999999999` |
| `text` | Pre-filled message (overrides default) | `Hello!` |
| `utm_*` | UTM parameters (preserved in redirect) | `utm_source=facebook` |

**Example URLs:**

```
# Basic redirect (uses defaults from config)
https://r.example.com/r/demo

# With custom phone and message
https://r.example.com/r/demo?phone=919999999999&text=Hello%20from%20ad!

# With UTM tracking
https://r.example.com/r/demo?utm_source=facebook&utm_campaign=summer2024
```

### Preview Page

```
GET /preview/:slug
```

Explicitly render the preview page (useful for testing).

## Platform Detection Logic

| Platform | User-Agent Pattern |
|----------|-------------------|
| iOS | `/(iPhone\|iPad\|iPod)/i` |
| Android | `/Android/i` |
| Desktop | Everything else |

## Bot Detection

The following bots receive a preview page (200 HTML) instead of a redirect:

- **Social Media**: LinkedInBot, Twitterbot, facebookexternalhit, Slackbot, Discordbot, WhatsApp, TelegramBot
- **Search Engines**: Googlebot, bingbot, Baiduspider, YandexBot, DuckDuckBot
- **Others**: Applebot, iMessageLinkPreviews, Pinterest, Redditbot

## URL Building

### WhatsApp URL Formats Supported

```
# wa.me format
https://wa.me/919999999999?text=Hello%20World

# api.whatsapp.com format
https://api.whatsapp.com/send?phone=919999999999&text=Hello%20World

# web.whatsapp.com format
https://web.whatsapp.com/send?phone=919999999999&text=Hello%20World
```

## Deployment

### Render

1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Fly.io

```bash
# Install flyctl
fly launch

# Set secrets
fly secrets set ALLOWED_HOSTS=wa.me,api.whatsapp.com,web.whatsapp.com,flow.example.com

# Deploy
fly deploy
```

### Vercel

The project includes a `vercel.json` for serverless deployment:

```bash
vercel --prod
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Logging

All logs are output as JSON to stdout (Pino format):

```json
{
  "level": 30,
  "time": 1699900000000,
  "event": "redirect",
  "slug": "demo",
  "platform": "ios",
  "browser": "Mobile Safari",
  "os": "iOS",
  "referer": "https://facebook.com",
  "hashedIp": "a1b2c3d4e5f6g7h8",
  "durationMs": 5,
  "targetHost": "wa.me"
}
```

## Security

- **Allowlisted Hosts**: Only redirects to hosts in `ALLOWED_HOSTS`
- **Rate Limiting**: Per-IP rate limiting to prevent abuse
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, CSP, HSTS
- **IP Hashing**: Raw IPs are never stored; only SHA-256 hashes for analytics

## License

MIT
