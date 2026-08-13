import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { stagesController } from './stages.controller';
import { createStageSchema, reorderStagesSchema, updateStageSchema } from './stages.dto';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(stagesController.list));
router.get('/:id', asyncHandler(stagesController.getById));
router.post('/', authorize(Role.ADMIN), validate(createStageSchema), asyncHandler(stagesController.create));
router.patch('/:id', authorize(Role.ADMIN), validate(updateStageSchema), asyncHandler(stagesController.update));
router.delete('/:id', authorize(Role.ADMIN), asyncHandler(stagesController.remove));
router.post('/reorder', authorize(Role.ADMIN), validate(reorderStagesSchema), asyncHandler(stagesController.reorder));

export default router;
