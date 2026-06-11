/**
 * Production environment configuration.
 * API URL is injected at build time via CI/CD pipeline environment variables.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
};
