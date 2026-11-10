import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from './errorHandler.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'evalengine_dev_secret_key_9f8e7d6c5b4a';

/**
 * Verifies Authorization: Bearer <token> header and attaches user to req.user.
 */
export const verifyToken = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Authentication token is empty.', 401, 'UNAUTHORIZED');
  }

  const decoded = jwt.verify(token, getJwtSecret());
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User belonging to this token no longer exists.', 401, 'UNAUTHORIZED');
  }

  req.user = user;
  next();
});

/**
 * Optionally parses Authorization Bearer token if present without failing unauthenticated requests.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    }
  } catch {
    // Ignore invalid optional token and continue as unauthenticated
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Example: requireRole('instructor')
 */
export const requireRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Requires role: ${allowedRoles.join(' or ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
};
