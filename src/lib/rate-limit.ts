// ========================================
// lib/rate-limit.ts - Simple In-Memory Rate Limiter
// ========================================

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  limit: number;          // Max requests
  windowMs: number;       // Time window in milliseconds
}

export function rateLimit(identifier: string, config: RateLimitConfig): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = identifier;

  // Initialize or reset if window expired
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: store[key].resetTime,
    };
  }

  // Check if limit exceeded
  if (store[key].count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: store[key].resetTime,
    };
  }

  // Increment count
  store[key].count++;

  return {
    success: true,
    remaining: config.limit - store[key].count,
    resetTime: store[key].resetTime,
  };
}

// Helper to get client IP or identifier
export function getClientIdentifier(request: Request): string {
  // Try various headers for IP (works with most proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare specific
  
  const ip = cfConnectingIp || forwarded?.split(',')[0] || realIp || 'unknown';
  return ip.trim();
}
