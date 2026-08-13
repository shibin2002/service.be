import fs from 'fs';
import path from 'path';
import { AttachmentType } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError, ValidationError } from '../common/errors/AppError';
import { uploadRoot } from '../common/middleware/upload.middleware';

export class AttachmentsService {
  async listByJob(jobId: string) {
    return prisma.attachment.findMany({
      where: { jobId, deletedAt: null },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    jobId: string,
    uploadedById: string,
    type: AttachmentType,
    file?: Express.Multer.File,
  ) {
    if (!file) throw new ValidationError('File is required');

    const job = await prisma.serviceJob.findFirst({ where: { id: jobId, deletedAt: null } });
    if (!job) throw new NotFoundError('Service job');

    return prisma.attachment.create({
      data: {
        jobId,
        uploadedById,
        type,
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.filename,
      },
    });
  }

  async getById(id: string) {
    const attachment = await prisma.attachment.findFirst({ where: { id, deletedAt: null } });
    if (!attachment) throw new NotFoundError('Attachment');
    return attachment;
  }

  getAbsolutePath(fileName: string): string {
    return path.join(uploadRoot, fileName);
  }

  async softDelete(id: string) {
    const attachment = await this.getById(id);
    await prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });

    const abs = this.getAbsolutePath(attachment.fileName);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }

    return { message: 'Attachment deleted' };
  }
}

export const attachmentsService = new AttachmentsService();
