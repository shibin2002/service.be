import { Router } from 'express';
import { authenticate } from '../common/middleware/auth.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { notificationsController } from './notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(notificationsController.list));
router.patch('/:id/read', asyncHandler(notificationsController.markRead));
router.post('/read-all', asyncHandler(notificationsController.markAllRead));

export default router;
