import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Environment configuration schema
const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  ALLOWED_HOSTS: z.string().default('wa.me,api.whatsapp.com,web.whatsapp.com'),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

// Link configuration schema
const linkConfigSchema = z.record(
  z.string(),
  z.object({
    androidFlowUrl: z.string().url(),
    iosWhatsappBaseUrl: z.string().url(),
    desktopWhatsappBaseUrl: z.string().url(),
    defaultPhone: z.string().optional(),
    defaultText: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
  })
);

export type LinkConfig = z.infer<typeof linkConfigSchema>;
export type LinkEntry = LinkConfig[string];

// Parse environment variables
export function loadEnvConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

// Load links configuration from JSON file
export function loadLinksConfig(): LinkConfig {
  const configPath = join(__dirname, '..', 'config', 'links.json');
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = linkConfigSchema.safeParse(parsed);
    if (!result.success) {
      console.error('Invalid links configuration:', result.error.format());
      process.exit(1);
    }
    return result.data;
  } catch (err) {
    console.error('Failed to load links.json:', err);
    process.exit(1);
  }
}

// Get allowed hosts as a Set for O(1) lookup
export function getAllowedHosts(hostsString: string): Set<string> {
  return new Set(
    hostsString
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );
}

// Singleton configuration
let envConfig: ReturnType<typeof loadEnvConfig> | null = null;
let linksConfig: LinkConfig | null = null;

export function getEnvConfig() {
  if (!envConfig) {
    envConfig = loadEnvConfig();
  }
  return envConfig;
}

export function getLinksConfig() {
  if (!linksConfig) {
    linksConfig = loadLinksConfig();
  }
  return linksConfig;
}

export function resetConfig() {
  envConfig = null;
  linksConfig = null;
}
