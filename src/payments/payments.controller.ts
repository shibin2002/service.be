import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { paymentsService } from './payments.service';

export class PaymentsController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await paymentsService.list(req.query as never);
    res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
  };

  getByJob = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await paymentsService.getByJobId(req.params.jobId)));
  };

  updateByJob = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await paymentsService.updateByJobId(req.params.jobId, req.body, req.user!.sub);
    res.json(successResponse(data, 'Payment updated'));
  };
}

export const paymentsController = new PaymentsController();
