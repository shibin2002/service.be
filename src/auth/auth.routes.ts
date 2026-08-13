import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.dto';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));
router.get('/me', authenticate, asyncHandler(authController.me));

// Admin-only user registration with elevated roles
router.post(
  '/register-staff',
  authenticate,
  authorize(Role.ADMIN),
  validate(registerSchema),
  asyncHandler(authController.register),
);

export default router;
