import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { upload } from '../common/middleware/upload.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { attachmentsController } from './attachments.controller';

const router = Router();
router.use(authenticate);

router.get('/job/:jobId', asyncHandler(attachmentsController.list));
router.post('/job/:jobId', upload.single('file'), asyncHandler(attachmentsController.upload));
router.get('/:id/download', asyncHandler(attachmentsController.download));
router.delete('/:id', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(attachmentsController.remove));

export default router;
