import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { PaginationQuery, getPagination } from '../common/utils/pagination';
import { ConflictError, ForbiddenError, NotFoundError } from '../common/errors/AppError';
import { CreateUserDto, UpdateUserDto } from './users.dto';
import { JwtPayload } from '../common/middleware/auth.types';

const safeSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class UsersService {
  async list(query: PaginationQuery & { role?: Role; isActive?: boolean }) {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: safeSelect,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: safeSelect });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async getFullById(id: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async create(dto: CreateUserDto, actorRole?: Role) {
    const existing = await prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const role = dto.role ?? Role.TECHNICIAN;
    if ((role === Role.ADMIN || role === Role.MANAGER) && actorRole !== Role.ADMIN) {
      throw new ForbiddenError('Only admins can assign elevated roles');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role,
      },
      select: safeSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto, actor?: JwtPayload) {
    const user = await this.getFullById(id);

    if (dto.isActive === false) {
      if (user.role === Role.ADMIN) {
        throw new ForbiddenError('Admin accounts cannot be deactivated');
      }
      if (actor && actor.sub === id) {
        throw new ForbiddenError('You cannot deactivate your own account');
      }
    }

    if (dto.role && dto.role !== user.role) {
      if (user.role === Role.ADMIN) {
        throw new ForbiddenError('Admin roles cannot be changed');
      }
      if ((dto.role === Role.ADMIN || dto.role === Role.MANAGER) && actor?.role !== Role.ADMIN) {
        throw new ForbiddenError('Only admins can assign elevated roles');
      }
    }

    return prisma.user.update({
      where: { id },
      data: dto,
      select: safeSelect,
    });
  }

  async softDelete(id: string, actor?: JwtPayload) {
    const user = await this.getFullById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenError('Admin accounts cannot be deleted');
    }
    if (actor && actor.sub === id) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, refreshToken: null },
    });
    return { message: 'User deleted' };
  }

  async listTechnicians(actor?: JwtPayload) {
    const roles: Role[] = actor?.role === Role.ADMIN ? [Role.TECHNICIAN, Role.MANAGER] : [Role.TECHNICIAN];
    return prisma.user.findMany({
      where: { deletedAt: null, role: { in: roles } },
      select: safeSelect,
      orderBy: { fullName: 'asc' },
    });
  }
}

export const usersService = new UsersService();
