import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  // JWT is set by the backend as an httpOnly cookie on login —
  // withCredentials ensures it's sent on every request automatically.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Centralized 401 handling — session expired / not logged in.
// Consuming code (authStore) still owns redirect logic; this just
// normalizes the error shape so callers don't each parse axios errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;