import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../common/errors/AppError';
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../common/middleware/auth.middleware';
import { authRepository } from './auth.repository';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
} from './auth.dto';

export class AuthService {
  async register(dto: RegisterDto, actorRole?: Role) {
    const existing = await authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Only admins can create ADMIN/MANAGER accounts
    const role = dto.role ?? Role.TECHNICIAN;
    if ((role === Role.ADMIN || role === Role.MANAGER) && actorRole !== Role.ADMIN) {
      throw new ForbiddenError('Only admins can assign elevated roles');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await authRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      role,
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: authRepository.toSafeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: authRepository.toSafeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await authRepository.findById(payload.sub);
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string) {
    await authRepository.updateRefreshToken(userId, null);
    return { message: 'Logged out' };
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email);
    // Always return success to avoid email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset token has been generated', resetToken: null };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await authRepository.setResetToken(user.id, resetToken, resetExpires);

    // In production, send email. For API clients we return token in non-prod.
    return {
      message: 'If the email exists, a reset token has been generated',
      resetToken: process.env.NODE_ENV === 'production' ? null : resetToken,
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await authRepository.findByResetToken(token);
    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await authRepository.updatePassword(user.id, passwordHash);
    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await authRepository.updatePassword(userId, passwordHash);
    return { message: 'Password changed successfully' };
  }

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return authRepository.toSafeUser(user);
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await authRepository.updateRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
