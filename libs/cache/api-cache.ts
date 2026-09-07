
import { redis } from "@/libs/redis";

const CACHE_PREFIX = "api-cache";

export function createCacheKey(
  pathname: string,
  method: string,
  params: Record<string, unknown> = {}
) {
  const normalizedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = params[key];
      return result;
    }, {});

  return `${CACHE_PREFIX}:${method}:${pathname}:${JSON.stringify(
    normalizedParams
  )}`;
}

/**
 * Get cached data
 */
export async function getCache<T>(
  key: string
): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);

    return data ?? null;
  } catch (error) {
    console.error("REDIS GET ERROR:", error);

    // Redis failure should NOT crash your API.
    return null;
  }
}

/**
 * Save data in cache
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds = 60
) {
  try {
    await redis.set(key, data, {
      ex: ttlSeconds,
    });
  } catch (error) {
    console.error("REDIS SET ERROR:", error);
  }
}

/**
 * Delete one cache key
 */
export async function deleteCache(key: string) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("REDIS DELETE ERROR:", error);
  }
}

/**
 * Delete all cache entries for a resource.
 *
 * Example:
 *
 * invalidateCache("busses")
 *
 * will invalidate:
 *
 * api-cache:GET:/api/busses:...
 */
export async function invalidateCache(
  resource: string
) {
  try {
    const pattern = `${CACHE_PREFIX}:*:/api/${resource}:*`;

    let cursor = "0";

    do {
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });

      cursor = result[0];

      const keys = result[1];

      if (keys.length > 0) {
        await redis.del(...keys);
      }

    } while (cursor !== "0");

  } catch (error) {
    console.error(
      "REDIS INVALIDATE ERROR:",
      error
    );
  }
}

