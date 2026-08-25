import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export function extractUserFromRequest(req: Request): AuthenticatedRequest['user'] | undefined {
  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return { id: token };
    }
  }

  // 2. Upstream proxy/gateway headers (e.g. Next.js API Gateway or Envoy)
  const userId = req.headers['x-user-id'] as string;
  if (userId && typeof userId === 'string' && userId.trim()) {
    return {
      id: userId.trim(),
      email: (req.headers['x-user-email'] as string) || undefined,
      name: (req.headers['x-user-name'] as string) || undefined,
    };
  }

  return undefined;
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  req.user = extractUserFromRequest(req);
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const user = extractUserFromRequest(req);

  if (!user || !user.id) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Authentication required. Please sign in to perform this action.',
    });
  }

  req.user = user;
  next();
}
