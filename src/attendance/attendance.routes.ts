import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { attendanceController } from './attendance.controller';
import { markAttendanceSchema, bulkMarkAttendanceSchema } from './attendance.dto';

const router = Router();

router.use(authenticate);

router.get('/my', asyncHandler(attendanceController.getMyAttendance));
router.get('/users', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(attendanceController.getMarkableUsers));
router.get('/staff', authorize(Role.ADMIN, Role.MANAGER), asyncHandler(attendanceController.getStaffAttendance));
router.get('/all', authorize(Role.ADMIN), asyncHandler(attendanceController.getAllAttendance));
router.post('/', validate(markAttendanceSchema), asyncHandler(attendanceController.mark));
router.post('/bulk', validate(bulkMarkAttendanceSchema), asyncHandler(attendanceController.bulkMark));

export default router;
