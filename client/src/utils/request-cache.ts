// Global request cache to prevent duplicate API calls
const requestCache = new Map<string, Promise<any>>();
const responseCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBUG_MODE = process.env.NODE_ENV === "development";

export function getCachedResponse(key: string) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    if (DEBUG_MODE) console.log(`[Cache] Hit for key: ${key}`);
    return cached.data;
  }
  // Clean up expired cache
  if (cached) {
    responseCache.delete(key);
    if (DEBUG_MODE)
      console.log(`[Cache] Expired cache cleared for key: ${key}`);
  }
  return null;
}

export function setCachedResponse(
  key: string,
  data: any,
  ttl: number = CACHE_TTL
) {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
  if (DEBUG_MODE) console.log(`[Cache] Stored response for key: ${key}`);
}

export function getCachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if we have a cached response first
  const cachedResponse = getCachedResponse(key);
  if (cachedResponse) {
    return Promise.resolve(cachedResponse);
  }

  // Check if there's already a pending request
  const existingRequest = requestCache.get(key);
  if (existingRequest) {
    if (DEBUG_MODE)
      console.log(`[Cache] Reusing pending request for key: ${key}`);
    return existingRequest;
  }

  // Create new request and cache the promise
  if (DEBUG_MODE) console.log(`[Cache] Creating new request for key: ${key}`);
  const request = requestFn()
    .then((response) => {
      // Cache the successful response
      setCachedResponse(key, response);
      // Remove from pending requests
      requestCache.delete(key);
      if (DEBUG_MODE) console.log(`[Cache] Request completed for key: ${key}`);
      return response;
    })
    .catch((error) => {
      // Remove from pending requests on error
      requestCache.delete(key);
      if (DEBUG_MODE)
        console.log(`[Cache] Request failed for key: ${key}`, error);
      throw error;
    });

  requestCache.set(key, request);
  return request;
}

export function clearCache(key?: string) {
  if (key) {
    for (const k of Array.from(responseCache.keys())) {
      if (k === key || k.startsWith(`${key}?`) || k.startsWith(`${key}/`)) {
        responseCache.delete(k);
      }
    }
    for (const k of Array.from(requestCache.keys())) {
      if (k === key || k.startsWith(`${key}?`) || k.startsWith(`${key}/`)) {
        requestCache.delete(k);
      }
    }
    if (DEBUG_MODE)
      console.log(`[Cache] Cleared cache for key or prefix: ${key}`);
  } else {
    requestCache.clear();
    responseCache.clear();
    if (DEBUG_MODE) console.log(`[Cache] Cleared all cache`);
  }
}
