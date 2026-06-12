/**
 * Production environment configuration.
 * The gateway URL is injected at build time via CI/CD environment variables.
 * In production the gateway is typically served behind a reverse proxy (nginx/ALB).
 */
export const environment = {
  production: true,
  apiBaseUrl: '',   // empty = same origin (served behind reverse proxy)
};
