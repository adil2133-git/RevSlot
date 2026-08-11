import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Backend (auth.middleware.ts) reads `Authorization: Bearer <token>` — no
// cookies involved. Call this from authStore after login/hydrate/logout so
// every subsequent request carries the right header automatically.
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Normalizes error shape. Matches error.middleware.ts on the backend,
// which always responds with a top-level `message` field.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;