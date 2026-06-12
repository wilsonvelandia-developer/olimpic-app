/**
 * Development environment configuration.
 * The frontend communicates exclusively with the API Gateway on port 3000.
 * The gateway routes internally to each microservice — the frontend never
 * talks directly to individual service ports.
 */
export const environment = {
  production: false,
  /** API Gateway base URL — no trailing slash, no /api/v1 prefix */
  apiBaseUrl: 'http://localhost:3000',
};
