import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';
import { AuthRequest } from './auth.types';

export type { AuthRequest, JwtPayload } from './auth.types';
export type { JwtPayload as TokenPayload } from './auth.types';

export function signAccessToken(payload: import('./auth.types').JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: import('./auth.types').JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): import('./auth.types').JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as import('./auth.types').JwtPayload;
}

export function verifyRefreshToken(token: string): import('./auth.types').JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as import('./auth.types').JwtPayload;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
      return;
    }
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      if (roles.length && !roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
