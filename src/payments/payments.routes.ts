import { Router } from 'express';
import { authenticate } from '../common/middleware/auth.middleware';
import { validate } from '../common/middleware/validate.middleware';
import { asyncHandler } from '../common/utils/asyncHandler';
import { paymentsController } from './payments.controller';
import { listPaymentsSchema, updatePaymentSchema } from './payments.dto';

const router = Router();
router.use(authenticate);

router.get('/', validate(listPaymentsSchema, 'query'), asyncHandler(paymentsController.list));
router.get('/job/:jobId', asyncHandler(paymentsController.getByJob));
router.patch('/job/:jobId', validate(updatePaymentSchema), asyncHandler(paymentsController.updateByJob));

export default router;
