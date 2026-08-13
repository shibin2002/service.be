import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { enquiriesController } from './enquiries.controller';
import { createEnquirySchema, listEnquiriesSchema, updateEnquirySchema } from './enquiries.dto';

const router = Router();
router.use(authenticate);

router.get('/', validate(listEnquiriesSchema, 'query'), asyncHandler(enquiriesController.list));
router.get('/:id', asyncHandler(enquiriesController.getById));
router.post('/', validate(createEnquirySchema), asyncHandler(enquiriesController.create));
router.patch('/:id', validate(updateEnquirySchema), asyncHandler(enquiriesController.update));
router.delete('/:id', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(enquiriesController.remove));

export default router;