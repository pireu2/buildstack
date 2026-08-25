import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userName = req.headers['x-user-name'] as string;

  if (userId) {
    req.user = {
      id: userId,
      email: userEmail,
      name: userName,
    };
  }

  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required. Please sign in to perform this action.',
    });
  }

  req.user = {
    id: userId,
    email: req.headers['x-user-email'] as string,
    name: req.headers['x-user-name'] as string,
  };

  next();
}
