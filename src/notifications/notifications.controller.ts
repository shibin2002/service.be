import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { notificationService } from './notifications.service';

export class NotificationsController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await notificationService.list(req.user!.sub, req.query as never);
    res.json({
      ...paginatedResponse(result.data, result.total, result.page, result.limit),
      unreadCount: result.unreadCount,
    });
  };

  markRead = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await notificationService.markRead(req.params.id, req.user!.sub)));
  };

  markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await notificationService.markAllRead(req.user!.sub)));
  };
}

export const notificationsController = new NotificationsController();
