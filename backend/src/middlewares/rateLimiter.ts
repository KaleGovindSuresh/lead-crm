import rateLimit from "express-rate-limit";
import { config } from "../config/env";

export const loginRateLimiter = rateLimit({
  windowMs: config.loginRateLimitWindowMs,
  max: config.loginRateLimitMax,
  message: {
    message: `Too many login attempts. Please try again after ${
      config.loginRateLimitWindowMs / 1000
    } seconds.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
