import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please wait a moment before trying again.',
      retry_after_seconds: 60,
    });
  },
});
