import { Response } from 'express';
import { AttachmentType } from '@prisma/client';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { successResponse } from '../common/utils/pagination';
import { attachmentsService } from './attachments.service';

export class AttachmentsController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await attachmentsService.listByJob(req.params.jobId)));
  };

  upload = async (req: AuthRequest, res: Response): Promise<void> => {
    const type = (req.body.type as AttachmentType) || AttachmentType.DOCUMENT;
    const data = await attachmentsService.upload(
      req.params.jobId,
      req.user!.sub,
      type,
      req.file,
    );
    res.status(201).json(successResponse(data, 'File uploaded'));
  };

  download = async (req: AuthRequest, res: Response): Promise<void> => {
    const attachment = await attachmentsService.getById(req.params.id);
    const abs = attachmentsService.getAbsolutePath(attachment.fileName);
    res.download(abs, attachment.originalName);
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await attachmentsService.softDelete(req.params.id)));
  };
}

export const attachmentsController = new AttachmentsController();
