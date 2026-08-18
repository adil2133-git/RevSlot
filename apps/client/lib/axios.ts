import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  // accessToken/refreshToken are httpOnly cookies set by the backend —
  // withCredentials makes the browser send + accept them automatically.
  // No manual header attachment needed (and none is possible — httpOnly
  // means JS can't read the token even if we wanted to).
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Registered by AuthProvider on mount. Called when a refresh attempt
// itself fails — i.e. the refresh token is also expired/invalid and the
// user needs to be sent back to login.
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

let pendingRefresh: Promise<void> | null = null;

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
        pendingRefresh ??= api
          .post("/auth/refresh")
          .then(() => undefined)
          .finally(() => {
            pendingRefresh = null;
          });
        await pendingRefresh;
        return api(originalRequest);
      } catch {
        sessionExpiredHandler?.();
      }
    }

    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new ApiError(message, error.response?.status));
  }
);

export default api;