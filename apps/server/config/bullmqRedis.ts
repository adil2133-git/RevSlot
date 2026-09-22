import { Redis as IORedis } from "ioredis";

// BullMQ needs a raw TCP Redis connection with blocking commands
// (BRPOPLPUSH, streams, etc.) — the existing @upstash/redis client in
// config/redis.ts is REST/HTTP-based and cannot be used for this.
//
// Get this from the Upstash console: open your database → "Connect" tab →
// "ioredis" — it looks like: rediss://default:<password>@<endpoint>:<port>
const REDIS_URL = process.env.REDIS_URL as string;

if (!REDIS_URL) {
  throw new Error(
    "REDIS_URL is not set. BullMQ requires a direct TCP Redis connection string " +
      "(different from UPSTASH_REDIS_REST_URL/TOKEN used elsewhere) — see Upstash console > Connect > ioredis."
  );
}

// maxRetriesPerRequest: null is required by BullMQ — without it, ioredis
// gives up on blocking commands too early and BullMQ throws at startup.
export const bullmqConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});