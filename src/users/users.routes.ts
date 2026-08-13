import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { usersController } from './users.controller';
import { listUsersSchema, createUserSchema, updateUserSchema } from './users.dto';

const router = Router();

router.use(authenticate);

router.get('/technicians', asyncHandler(usersController.technicians));
router.get('/', authorize(Role.ADMIN, Role.MANAGER), validate(listUsersSchema, 'query'), asyncHandler(usersController.list));
router.get('/:id', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(usersController.getById));
router.post('/', authorize(Role.ADMIN, Role.MANAGER), validate(createUserSchema), asyncHandler(usersController.create));
router.patch('/:id', authorize(Role.ADMIN), validate(updateUserSchema), asyncHandler(usersController.update));
router.delete('/:id', authorize(Role.ADMIN), asyncHandler(usersController.remove));

export default router;
