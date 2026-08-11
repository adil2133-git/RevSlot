// Plain document.cookie helpers — kept dependency-free (no js-cookie) since
// this is the only place we need cookie writes. The cookie only stores
// presence of a valid session for middleware.ts to check; the actual
// accessToken used for API calls lives in the Zustand store / localStorage.

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}