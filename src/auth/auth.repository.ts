import { Role, User } from '@prisma/client';
import prisma from '../prisma/client';

export class AuthRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role?: Role;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role ?? Role.TECHNICIAN,
      },
    });
  }

  updateRefreshToken(userId: string, refreshToken: string | null): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  setResetToken(userId: string, resetToken: string, resetExpires: Date): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { resetToken, resetExpires },
    });
  }

  findByResetToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  updatePassword(userId: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
        refreshToken: null,
      },
    });
  }

  toSafeUser(user: User) {
    const { passwordHash: _p, refreshToken: _r, resetToken: _t, resetExpires: _e, ...safe } = user;
    return safe;
  }
}

export const authRepository = new AuthRepository();
