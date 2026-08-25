import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RATE_LIMIT_CONSTANTS } from '../config/constants';

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please wait a moment before trying again.',
      retry_after_seconds: RATE_LIMIT_CONSTANTS.RETRY_AFTER_SECONDS,
    });
  },
});
