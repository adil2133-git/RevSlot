// In-memory access token storage — isolated in its own module to avoid
// circular dependencies and Turbopack stale HMR cache issues.
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}
