import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { serviceJobsController } from './service-jobs.controller';
import {
  changeStageSchema,
  createJobSchema,
  listJobsSchema,
  updateJobSchema,
} from './service-jobs.dto';

const router = Router();
router.use(authenticate);

router.get('/dashboard/stats', asyncHandler(serviceJobsController.dashboard));
router.get('/', validate(listJobsSchema, 'query'), asyncHandler(serviceJobsController.list));
router.get('/number/:jobNumber', asyncHandler(serviceJobsController.getByNumber));
router.get('/:id', asyncHandler(serviceJobsController.getById));
router.get('/:id/timeline', asyncHandler(serviceJobsController.timeline));
router.post('/', validate(createJobSchema), asyncHandler(serviceJobsController.create));
router.patch('/:id', validate(updateJobSchema), asyncHandler(serviceJobsController.update));
router.post('/:id/stage', validate(changeStageSchema), asyncHandler(serviceJobsController.changeStage));
router.delete('/:id', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(serviceJobsController.remove));

export default router;
