import { NotificationType, ServiceJob } from '@prisma/client';
import prisma from '../prisma/client';
import { getIO } from '../socket/socket';
import { getPagination, PaginationQuery } from '../common/utils/pagination';
import { NotFoundError } from '../common/errors/AppError';

type JobWithRelations = ServiceJob & {
  jobNumber: string;
  assignedTechnicianId?: string | null;
  currentStage?: { name: string } | null;
};

export class NotificationService {
  async create(params: {
    userId: string;
    jobId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    const notification = await prisma.notification.create({ data: params });
    try {
      const io = getIO();
      io.to(`user:${params.userId}`).emit('notification', notification);
      if (params.jobId) {
        io.to(`job:${params.jobId}`).emit('job:update', { type: params.type, jobId: params.jobId });
      }
    } catch {
      // Socket may not be initialized during tests/seed
    }
    return notification;
  }

  async notifyNewJob(job: JobWithRelations) {
    const managers = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true, role: { in: ['ADMIN', 'MANAGER'] } },
      select: { id: true },
    });

    await Promise.all(
      managers.map((u) =>
        this.create({
          userId: u.id,
          jobId: job.id,
          type: NotificationType.NEW_JOB,
          title: 'New Service Job',
          message: `Job ${job.jobNumber} has been created`,
        }),
      ),
    );

    try {
      getIO().emit('job:new', { jobId: job.id, jobNumber: job.jobNumber });
    } catch {
      /* ignore */
    }
  }

  async notifyStageUpdated(job: JobWithRelations) {
    const recipients = new Set<string>();
    if (job.assignedTechnicianId) recipients.add(job.assignedTechnicianId);
    if (job.createdById) recipients.add(job.createdById);

    const stageName = job.currentStage?.name ?? 'updated stage';
    await Promise.all(
      [...recipients].map((userId) =>
        this.create({
          userId,
          jobId: job.id,
          type: NotificationType.STAGE_UPDATED,
          title: 'Stage Updated',
          message: `Job ${job.jobNumber} moved to ${stageName}`,
        }),
      ),
    );
  }

  async notifyTechnicianAssigned(job: JobWithRelations) {
    if (!job.assignedTechnicianId) return;
    await this.create({
      userId: job.assignedTechnicianId,
      jobId: job.id,
      type: NotificationType.TECHNICIAN_ASSIGNED,
      title: 'Job Assigned',
      message: `You have been assigned to job ${job.jobNumber}`,
    });
  }

  async notifyPaymentCompleted(jobId: string, jobNumber: string, userIds: string[]) {
    await Promise.all(
      userIds.map((userId) =>
        this.create({
          userId,
          jobId,
          type: NotificationType.PAYMENT_COMPLETED,
          title: 'Payment Completed',
          message: `Payment completed for job ${jobNumber}`,
        }),
      ),
    );
  }

  async list(userId: string, query: PaginationQuery) {
    const { page, limit, skip } = getPagination(query);
    const where = { userId, deletedAt: null };
    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { job: { select: { id: true, jobNumber: true } } },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    return { data, total, page, limit, unreadCount };
  }

  async markRead(id: string, userId: string) {
    const n = await prisma.notification.findFirst({ where: { id, userId, deletedAt: null } });
    if (!n) throw new NotFoundError('Notification');
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }
}

export const notificationService = new NotificationService();
