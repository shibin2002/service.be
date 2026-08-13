import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError } from '../common/errors/AppError';
import { getPagination, PaginationQuery } from '../common/utils/pagination';
import { CreateDeviceDto, UpdateDeviceDto } from './devices.dto';

export class DevicesService {
  async list(query: PaginationQuery & { deviceType?: string }) {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.DeviceWhereInput = {
      deletedAt: null,
      ...(query.deviceType ? { deviceType: { equals: query.deviceType, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { brand: { contains: query.search, mode: 'insensitive' } },
              { model: { contains: query.search, mode: 'insensitive' } },
              { imei: { contains: query.search, mode: 'insensitive' } },
              { serialNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.device.findMany({ where, skip, take: limit, orderBy: { createdAt: query.sortOrder } }),
      prisma.device.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const device = await prisma.device.findFirst({ where: { id, deletedAt: null } });
    if (!device) throw new NotFoundError('Device');
    return device;
  }

  async create(dto: CreateDeviceDto) {
    return prisma.device.create({ data: dto });
  }

  async update(id: string, dto: UpdateDeviceDto) {
    await this.getById(id);
    return prisma.device.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.getById(id);
    await prisma.device.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Device deleted' };
  }
}

export const devicesService = new DevicesService();
