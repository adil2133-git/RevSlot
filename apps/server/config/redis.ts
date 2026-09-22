import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL as string;

if (!REDIS_URL) {
  throw new Error("REDIS_URL is not set.");
}

export const redis = new Redis(REDIS_URL);