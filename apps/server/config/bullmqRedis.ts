import { Redis as IORedis } from "ioredis";

// Redis connection used by BullMQ.
const REDIS_URL = process.env.REDIS_URL as string;

if (!REDIS_URL) {
  throw new Error(
    "REDIS_URL is not set. BullMQ requires a direct TCP Redis connection string."
  );
}

// maxRetriesPerRequest: null is required by BullMQ — without it, ioredis
// gives up on blocking commands too early and BullMQ throws at startup.
export const bullmqConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});