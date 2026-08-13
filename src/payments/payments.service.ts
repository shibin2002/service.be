import { PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError } from '../common/errors/AppError';
import { getPagination, PaginationQuery } from '../common/utils/pagination';
import { UpdatePaymentDto } from './payments.dto';
import { notificationService } from '../notifications/notifications.service';

function calcTotals(items: { amount: number }[], paid: number) {
  const total = Math.max(0, items.reduce((sum, it) => sum + it.amount, 0));
  const balance = Math.max(0, total - paid);
  let status: PaymentStatus = PaymentStatus.PENDING;
  if (balance <= 0 && total > 0) status = PaymentStatus.PAID;
  else if (paid > 0 && balance > 0) status = PaymentStatus.PARTIAL;
  return { total, balance, status };
}

export class PaymentsService {
  async list(query: PaginationQuery & { status?: PaymentStatus }) {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { job: { jobNumber: { contains: query.search, mode: 'insensitive' } } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: query.sortOrder },
        include: {
          items: true,
          job: {
            include: {
              customer: true,
              device: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getByJobId(jobId: string) {
    const payment = await prisma.payment.findFirst({
      where: { jobId, deletedAt: null },
      include: { items: true, job: { include: { customer: true } } },
    });
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }

  async updateByJobId(jobId: string, dto: UpdatePaymentDto, recordedById: string) {
    const existing = await this.getByJobId(jobId);
    const items = dto.items.map((it) => ({ name: it.name, amount: it.amount }));
    const paid = dto.paid ?? Number(existing.paid);
    const { total, balance, status } = calcTotals(items, paid);
    const wasPaid = existing.status === PaymentStatus.PAID;

    const updated = await prisma.payment.update({
      where: { id: existing.id },
      data: {
        paid,
        total,
        balance,
        status,
        recordedById,
        paidAt: status === PaymentStatus.PAID ? new Date() : null,
        items: {
          deleteMany: {},
          create: items,
        },
      },
      include: { items: true, job: true },
    });

    if (!wasPaid && status === PaymentStatus.PAID) {
      const recipients = [
        updated.job.createdById,
        updated.job.assignedTechnicianId,
      ].filter(Boolean) as string[];
      await notificationService.notifyPaymentCompleted(
        updated.jobId,
        updated.job.jobNumber,
        [...new Set(recipients)],
      );
    }

    return updated;
  }
}

export const paymentsService = new PaymentsService();