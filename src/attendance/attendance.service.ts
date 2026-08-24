import { Role } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError, ForbiddenError, ConflictError } from '../common/errors/AppError';
import type { MarkAttendanceInput, BulkMarkAttendanceInput, UpdateAttendanceInput } from './attendance.dto';

class AttendanceService {
  async mark(input: MarkAttendanceInput, markedById: string) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user || user.deletedAt) throw new NotFoundError('User');

    const markedBy = await prisma.user.findUnique({ where: { id: markedById } });
    if (!markedBy) throw new NotFoundError('User');

    const date = new Date(input.date + 'T00:00:00.000Z');

    if (markedBy.role === Role.TECHNICIAN) {
      if (input.userId !== markedById) {
        throw new ForbiddenError('Technicians can only mark their own attendance');
      }
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const markDate = new Date(input.date + 'T00:00:00.000Z');
      if (markDate.getTime() !== today.getTime()) {
        throw new ForbiddenError('Staff can only mark attendance for today');
      }
    } else if (markedBy.role === Role.MANAGER) {
      if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
        throw new ForbiddenError('Managers can only mark attendance for staff');
      }
    }

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: input.userId, date } },
    });

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: input.status, markedById },
      });
      return this.format(updated);
    }

    const record = await prisma.attendance.create({
      data: {
        userId: input.userId,
        date,
        status: input.status,
        markedById,
      },
    });
    return this.format(record);
  }

  async bulkMark(input: BulkMarkAttendanceInput, markedById: string) {
    const markedBy = await prisma.user.findUnique({ where: { id: markedById } });
    if (!markedBy) throw new NotFoundError('User');

    const date = new Date(input.date + 'T00:00:00.000Z');
    const results = [];

    for (const rec of input.records) {
      const user = await prisma.user.findUnique({ where: { id: rec.userId } });
      if (!user || user.deletedAt) continue;

      if (markedBy.role === Role.TECHNICIAN) {
        if (rec.userId !== markedById) continue;
      } else if (markedBy.role === Role.MANAGER) {
        if (user.role === Role.ADMIN || user.role === Role.MANAGER) continue;
      }

      const existing = await prisma.attendance.findUnique({
        where: { userId_date: { userId: rec.userId, date } },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: rec.status, markedById },
        });
        results.push(this.format(updated));
      } else {
        const record = await prisma.attendance.create({
          data: {
            userId: rec.userId,
            date,
            status: rec.status,
            markedById,
          },
        });
        results.push(this.format(record));
      }
    }

    return results;
  }

  async getMyAttendance(userId: string, month?: string, year?: string) {
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { markedBy: { select: { id: true, fullName: true } } },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: '', // will be filled by controller
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      markedById: r.markedById,
      markedByName: r.markedBy.fullName,
      createdAt: r.createdAt,
    }));
  }

  async getStaffAttendance(managerId: string, month?: string, year?: string, userId?: string) {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) throw new NotFoundError('User');

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const where: Record<string, unknown> = {
      date: { gte: start, lte: end },
    };

    if (userId) {
      where.userId = userId;
    }

    if (manager.role === Role.MANAGER) {
      where.user = { role: Role.TECHNICIAN };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, role: true } },
        markedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.fullName,
      userRole: r.user.role,
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      markedById: r.markedById,
      markedByName: r.markedBy.fullName,
      createdAt: r.createdAt,
    }));
  }

  async getAllAttendance(adminId: string, month?: string, year?: string, userId?: string) {
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const where: Record<string, unknown> = {
      date: { gte: start, lte: end },
    };

    if (userId) {
      where.userId = userId;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, role: true } },
        markedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ date: 'desc' }, { user: { fullName: 'asc' } }],
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.fullName,
      userRole: r.user.role,
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      markedById: r.markedById,
      markedByName: r.markedBy.fullName,
      createdAt: r.createdAt,
    }));
  }

  async getMarkableUsers(requesterId: string) {
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester) throw new NotFoundError('User');

    let roles: Role[];
    if (requester.role === Role.ADMIN) {
      roles = [Role.TECHNICIAN, Role.MANAGER];
    } else if (requester.role === Role.MANAGER) {
      roles = [Role.TECHNICIAN];
    } else {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { deletedAt: null, isActive: true },
          {
            OR: [
              { role: { in: roles } },
              { id: requesterId },
            ],
          },
        ],
      },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: 'asc' },
    });

    return users;
  }

  private format(record: {
    id: string;
    userId: string;
    date: Date;
    status: boolean;
    markedById: string;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      userId: record.userId,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      markedById: record.markedById,
      createdAt: record.createdAt,
    };
  }
}

export const attendanceService = new AttendanceService();
