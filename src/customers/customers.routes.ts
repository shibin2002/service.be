import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { customersController } from './customers.controller';
import { createCustomerSchema, listCustomersSchema, updateCustomerSchema } from './customers.dto';

const router = Router();
router.use(authenticate);

router.get('/', validate(listCustomersSchema, 'query'), asyncHandler(customersController.list));
router.get('/:id', asyncHandler(customersController.getById));
router.get('/:id/history', asyncHandler(customersController.history));
router.post('/', validate(createCustomerSchema), asyncHandler(customersController.create));
router.patch('/:id', validate(updateCustomerSchema), asyncHandler(customersController.update));
router.delete('/:id', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(customersController.remove));

export default router;
