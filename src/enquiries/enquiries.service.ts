import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError } from '../common/errors/AppError';
import { getPagination, PaginationQuery } from '../common/utils/pagination';
import { CreateEnquiryDto, UpdateEnquiryDto } from './enquiries.dto';

export class EnquiriesService {
  async list(query: PaginationQuery) {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.EnquiryWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { enquiry: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      prisma.enquiry.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const enquiry = await prisma.enquiry.findFirst({ where: { id, deletedAt: null } });
    if (!enquiry) throw new NotFoundError('Enquiry');
    return enquiry;
  }

  async create(dto: CreateEnquiryDto) {
    return prisma.enquiry.create({ data: dto });
  }

  async update(id: string, dto: UpdateEnquiryDto) {
    await this.getById(id);
    return prisma.enquiry.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.getById(id);
    await prisma.enquiry.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Enquiry deleted' };
  }
}

export const enquiriesService = new EnquiriesService();