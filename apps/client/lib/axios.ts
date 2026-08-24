import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  // withCredentials is still needed so the httpOnly refreshToken cookie
  // rides along on /auth/refresh and /auth/logout calls. The accessToken
  // is NOT a cookie anymore — it lives in memory only (set below) and
  // gets attached manually via the Authorization header on every request.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// In-memory only — never localStorage (readable by any injected/XSS JS)
// and never a cookie (that's the whole point of moving it here). Lost on
// a hard refresh by design; AuthProvider re-establishes it on every app
// load via refreshAccessToken() + getMe().
let currentAccessToken: string | null = null;
export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// Registered by AuthProvider on mount. Called when a refresh attempt
// itself fails — i.e. the refresh token is also expired/invalid/revoked
// and the user needs to be sent back to login.
let sessionExpiredHandler: (() => void) | null = null;
export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

// Don't attempt refresh-and-retry for the auth endpoints themselves —
// a 401 from /login or /refresh means "wrong credentials" or "truly
// expired," not "needs a refresh." Logout IS allowed to retry, since an
// expired accessToken shouldn't block a successful logout when the
// refresh token is still valid.
const SKIP_REFRESH_FOR = ["/auth/reviewer/login", "/auth/admin/login", "/auth/refresh"];

let pendingRefresh: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = api
    .post("/auth/refresh")
    .then((res) => {
      const newToken = res.data.data.accessToken;

      setAccessToken(newToken);

      return newToken;
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

// Small typed error so callers can branch on status (e.g. Google auth's
// 422 "WhatsApp number required for new account") without re-parsing
// axios internals.
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};
    const url: string = originalRequest.url ?? "";
    const shouldSkip = SKIP_REFRESH_FOR.some((path) => url.includes(path));

    if (error.response?.status === 401 && !shouldSkip && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        // Capture the NEW access token from the response and store it —
        // the previous version discarded the refresh response entirely,
        // which worked when the access token was also a cookie (the
        // browser carried it forward automatically) but silently does
        // nothing useful now that it only lives in this module's memory.
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        sessionExpiredHandler?.();
      }
    }

    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new ApiError(message, error.response?.status));
  }
);

export default api;