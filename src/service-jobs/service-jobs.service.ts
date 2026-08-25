import { PaymentStatus, Prisma, Priority } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError, ValidationError } from '../common/errors/AppError';
import { getPagination, PaginationQuery } from '../common/utils/pagination';
import { CreateJobDto, UpdateJobDto } from './service-jobs.dto';
import { notificationService } from '../notifications/notifications.service';

const jobInclude = {
  customer: true,
  device: true,
  currentStage: true,
  assignedTechnician: { select: { id: true, fullName: true, email: true, phone: true } },
  createdBy: { select: { id: true, fullName: true } },
  payment: true,
  attachments: { where: { deletedAt: null } },
  stageLogs: {
    include: {
      stage: true,
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.ServiceJobInclude;

async function nextJobNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await tx.jobCounter.findUnique({ where: { id: 'default' } });

  if (!counter) {
    await tx.jobCounter.create({ data: { id: 'default', year, sequence: 1 } });
    return `JOB-${year}-00001`;
  }

  const sequence = counter.year !== year ? 1 : counter.sequence + 1;
  await tx.jobCounter.update({
    where: { id: 'default' },
    data: { year, sequence },
  });

  return `JOB-${year}-${String(sequence).padStart(5, '0')}`;
}

export class ServiceJobsService {
  async list(
    query: PaginationQuery & {
      status?: string;
      stageId?: string;
      technicianId?: string;
      deviceType?: string;
      priority?: Priority;
      paymentStatus?: PaymentStatus;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ) {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.ServiceJobWhereInput = {
      ...(query.stageId ? { currentStageId: query.stageId } : {}),
      ...(query.status ? { currentStage: { slug: query.status } } : {}),
      ...(query.technicianId ? { assignedTechnicianId: query.technicianId } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.paymentStatus ? { payment: { status: query.paymentStatus } } : {}),
      ...(query.deviceType
        ? { device: { deviceType: { equals: query.deviceType, mode: 'insensitive' } } }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            receivedAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { jobNumber: { contains: query.search, mode: 'insensitive' } },
              { customer: { name: { contains: query.search, mode: 'insensitive' } } },
              { customer: { phone: { contains: query.search, mode: 'insensitive' } } },
              { device: { imei: { contains: query.search, mode: 'insensitive' } } },
              { device: { serialNumber: { contains: query.search, mode: 'insensitive' } } },
              { device: { model: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.serviceJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortOrder },
        include: {
          customer: true,
          device: true,
          currentStage: true,
          assignedTechnician: { select: { id: true, fullName: true } },
          createdBy: { select: { id: true, fullName: true } },
          payment: true,
        },
      }),
      prisma.serviceJob.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const job = await prisma.serviceJob.findFirst({
      where: { id },
      include: jobInclude,
    });
    if (!job) throw new NotFoundError('Service job');
    return job;
  }

  async getByJobNumber(jobNumber: string) {
    const job = await prisma.serviceJob.findFirst({
      where: { jobNumber },
      include: jobInclude,
    });
    if (!job) throw new NotFoundError('Service job');
    return job;
  }

  async create(dto: CreateJobDto, createdById: string) {
    const job = await prisma.$transaction(async (tx) => {
      let customerId = dto.customerId;
      if (!customerId && dto.customer) {
        const customer = await tx.customer.create({ data: dto.customer });
        customerId = customer.id;
      }
      if (!customerId) throw new ValidationError('Customer is required');

      let deviceId = dto.deviceId;
      if (!deviceId && dto.device) {
        const device = await tx.device.create({ data: dto.device });
        deviceId = device.id;
      }
      if (!deviceId) throw new ValidationError('Device is required');

      let stageId = dto.stageId;
      if (!stageId) {
        const received = await tx.workflowStage.findFirst({
          where: { slug: 'received', deletedAt: null },
        });
        if (!received) throw new ValidationError('Default Received stage is missing');
        stageId = received.id;
      }

      const jobNumber = await nextJobNumber(tx);

      const created = await tx.serviceJob.create({
        data: {
          jobNumber,
          customerId,
          deviceId,
          reportedIssue: dto.reportedIssue,
          diagnosis: dto.diagnosis,
          technicianNotes: dto.technicianNotes,
          assignedTechnicianId: dto.assignedTechnicianId,
          createdById,
          priority: dto.priority ?? Priority.MEDIUM,
          warranty: dto.warranty ?? false,
          currentStageId: stageId,
          estimatedDelivery: dto.estimatedDelivery,
        },
        include: jobInclude,
      });

      await tx.stageLog.create({
        data: {
          jobId: created.id,
          stageId,
          userId: createdById,
          note: 'Job created',
        },
      });

      await tx.payment.create({
        data: { jobId: created.id },
      });

      return created;
    });

    await notificationService.notifyNewJob(job);
    if (job.assignedTechnicianId) {
      await notificationService.notifyTechnicianAssigned(job);
    }

    return this.getById(job.id);
  }

  async update(id: string, dto: UpdateJobDto, userId: string) {
    const existing = await this.getById(id);
    const stageChanged = dto.currentStageId && dto.currentStageId !== existing.currentStageId;
    const techChanged =
      dto.assignedTechnicianId !== undefined &&
      dto.assignedTechnicianId !== existing.assignedTechnicianId;

    const updated = await prisma.$transaction(async (tx) => {
      const job = await tx.serviceJob.update({
        where: { id },
        data: {
          reportedIssue: dto.reportedIssue,
          diagnosis: dto.diagnosis,
          technicianNotes: dto.technicianNotes,
          assignedTechnicianId: dto.assignedTechnicianId,
          priority: dto.priority,
          warranty: dto.warranty,
          estimatedDelivery: dto.estimatedDelivery,
          currentStageId: dto.currentStageId,
        },
        include: jobInclude,
      });

      if (stageChanged && dto.currentStageId) {
        await tx.stageLog.create({
          data: {
            jobId: id,
            stageId: dto.currentStageId,
            userId,
            note: dto.stageNote ?? 'Stage updated',
          },
        });
      }

      return job;
    });

    if (stageChanged) {
      await notificationService.notifyStageUpdated(updated);
    }
    if (techChanged && updated.assignedTechnicianId) {
      await notificationService.notifyTechnicianAssigned(updated);
    }

    return this.getById(id);
  }

  async changeStage(id: string, stageId: string, userId: string, note?: string) {
    return this.update(id, { currentStageId: stageId, stageNote: note }, userId);
  }

  async timeline(id: string) {
    await this.getById(id);
    return prisma.stageLog.findMany({
      where: { jobId: id },
      include: {
        stage: true,
        user: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async softDelete(id: string) {
    await this.getById(id);
    await prisma.serviceJob.delete({ where: { id } });
    return { message: 'Service job deleted' };
  }

  async dashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const stages = await prisma.workflowStage.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    const [
      totalJobs,
      receivedToday,
      inProgress,
      waitingForParts,
      readyForPickup,
      delivered,
      pendingPayments,
    ] = await Promise.all([
      prisma.serviceJob.count({ where: {} }),
      prisma.serviceJob.count({ where: { receivedAt: { gte: startOfDay } } }),
      prisma.serviceJob.count({
        where: {
          currentStage: { slug: { in: ['inspection', 'waiting-for-approval', 'repairing', 'quality-check'] } },
        },
      }),
      prisma.serviceJob.count({
        where: { currentStage: { slug: 'waiting-for-parts' } },
      }),
      prisma.serviceJob.count({
        where: { currentStage: { slug: 'ready-for-pickup' } },
      }),
      prisma.serviceJob.count({
        where: { currentStage: { slug: 'delivered' } },
      }),
      prisma.payment.count({
        where: { deletedAt: null, status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } },
      }),
    ]);

    const jobsByStatus = await Promise.all(
      stages.map(async (stage) => ({
        stage: stage.name,
        slug: stage.slug,
        color: stage.color,
        count: await prisma.serviceJob.count({
          where: { currentStageId: stage.id },
        }),
      })),
    );

    const now = new Date();
    const months: { month: string; count: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const [count, paid] = await Promise.all([
        prisma.serviceJob.count({
          where: { receivedAt: { gte: from, lt: to } },
        }),
        prisma.payment.aggregate({
          where: {
            deletedAt: null,
            status: PaymentStatus.PAID,
            paidAt: { gte: from, lt: to },
          },
          _sum: { total: true },
        }),
      ]);
      months.push({
        month: from.toLocaleString('en', { month: 'short', year: 'numeric' }),
        count,
        revenue: Number(paid._sum.total ?? 0),
      });
    }

    const deviceTypes = await prisma.device.groupBy({
      by: ['deviceType'],
      where: { deletedAt: null },
      _count: { deviceType: true },
      orderBy: { _count: { deviceType: 'desc' } },
      take: 8,
    });

    return {
      cards: {
        totalJobs,
        receivedToday,
        inProgress,
        waitingForParts,
        readyForPickup,
        delivered,
        pendingPayments,
      },
      charts: {
        jobsByStatus,
        monthlyRepairs: months,
        revenue: months.map((m) => ({ month: m.month, revenue: m.revenue })),
        deviceTypes: deviceTypes.map((d) => ({
          type: d.deviceType,
          count: d._count.deviceType,
        })),
      },
    };
  }
}

export const serviceJobsService = new ServiceJobsService();
