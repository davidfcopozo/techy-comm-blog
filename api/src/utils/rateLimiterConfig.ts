import rateLimit from "express-rate-limit";

const isTest = () => process.env.NODE_ENV === "test";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes (20 per minute average)
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

// Stricter limits for write operations (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 write operations per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: isTest,
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for reading content
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
});

