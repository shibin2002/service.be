import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { devicesController } from './devices.controller';
import { createDeviceSchema, listDevicesSchema, updateDeviceSchema } from './devices.dto';

const router = Router();
router.use(authenticate);

router.get('/', validate(listDevicesSchema, 'query'), asyncHandler(devicesController.list));
router.get('/:id', asyncHandler(devicesController.getById));
router.post('/', validate(createDeviceSchema), asyncHandler(devicesController.create));
router.patch('/:id', validate(updateDeviceSchema), asyncHandler(devicesController.update));
router.delete('/:id', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(devicesController.remove));

export default router;
