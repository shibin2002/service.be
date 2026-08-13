import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { serviceJobsService } from './service-jobs.service';

export class ServiceJobsController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await serviceJobsService.list(req.query as never);
    res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await serviceJobsService.getById(req.params.id)));
  };

  getByNumber = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await serviceJobsService.getByJobNumber(req.params.jobNumber)));
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await serviceJobsService.create(req.body, req.user!.sub);
    res.status(201).json(successResponse(data, 'Service job created'));
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await serviceJobsService.update(req.params.id, req.body, req.user!.sub);
    res.json(successResponse(data, 'Service job updated'));
  };

  changeStage = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await serviceJobsService.changeStage(
      req.params.id,
      req.body.stageId,
      req.user!.sub,
      req.body.note,
    );
    res.json(successResponse(data, 'Stage updated'));
  };

  timeline = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await serviceJobsService.timeline(req.params.id)));
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await serviceJobsService.softDelete(req.params.id)));
  };

  dashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await serviceJobsService.dashboardStats()));
  };
}

export const serviceJobsController = new ServiceJobsController();
