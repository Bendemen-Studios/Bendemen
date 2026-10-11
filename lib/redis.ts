import "server-only";
import Redis from "ioredis";

const CACHE_TTL_SECONDS = 60;
let client: Redis | undefined;
let redisDisabled = false;

function getClient(): Redis | null {
  if (!process.env.REDIS_URL || redisDisabled) return null;
  if (client) return client;

  try {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      // A cache outage must never take the shop offline. Disable Redis for this
      // process and let the Next.js Data Cache / WooCommerce request take over.
      redisDisabled = true;
    });
    return client;
  } catch {
    redisDisabled = true;
    return null;
  }
}

export async function getRedisJson<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    redisDisabled = true;
    return null;
  }
}

export async function setRedisJson<T>(key: string, value: T, ttlSeconds = CACHE_TTL_SECONDS): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    redisDisabled = true;
  }
}
