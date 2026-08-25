import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError } from '../common/errors/AppError';
import { getPagination, PaginationQuery } from '../common/utils/pagination';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';

export class CustomersService {
  async list(query: PaginationQuery) {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortOrder },
        include: { _count: { select: { devices: true } } },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        devices: {
          where: {},
          include: {
            device: true,
            currentStage: true,
            assignedTechnician: { select: { id: true, fullName: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    return prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.getById(id);
    return prisma.customer.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.getById(id);
    await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Customer deleted' };
  }

  async repairHistory(id: string) {
    await this.getById(id);
    return prisma.serviceJob.findMany({
      where: { customerId: id },
      include: {
        device: true,
        currentStage: true,
        payment: true,
        assignedTechnician: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const customersService = new CustomersService();
