import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://auth.neon.tech',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'default-secret-at-least-32-characters-long-12345',
  },
  logLevel: 'silent',
});
