import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let sessionExpiredHandler: (() => void) | null = null;
export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

const SKIP_REFRESH_FOR = ["/auth/reviewer/login", "/auth/admin/login", "/auth/refresh"];

let pendingRefresh: Promise<void> | null = null;

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
    return Promise.reject(new Error(message));
  }
);

export default api;