import { Response } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { successResponse } from '../common/utils/pagination';
import { authService } from './auth.service';

export class AuthController {
  register = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.register(req.body, req.user?.role);
    res.status(201).json(successResponse(result, 'Registered successfully'));
  };

  login = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.login(req.body);
    res.json(successResponse(result, 'Login successful'));
  };

  refresh = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(successResponse(result, 'Token refreshed'));
  };

  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.logout(req.user!.sub);
    res.json(successResponse(result));
  };

  forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.forgotPassword(req.body.email);
    res.json(successResponse(result));
  };

  resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json(successResponse(result));
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.changePassword(req.user!.sub, req.body);
    res.json(successResponse(result));
  };

  me = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await authService.me(req.user!.sub);
    res.json(successResponse(result));
  };
}

export const authController = new AuthController();

// Used by open register endpoint — only TECHNICIAN self-register by default
export const PUBLIC_REGISTER_ROLE = Role.TECHNICIAN;
