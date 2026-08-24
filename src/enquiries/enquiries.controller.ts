import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { enquiriesService } from './enquiries.service';

export class EnquiriesController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await enquiriesService.list(req.query as never);
    res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await enquiriesService.getById(req.params.id);
    res.json(successResponse(data));
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await enquiriesService.create(req.body, req.user!.sub);
    res.status(201).json(successResponse(data, 'Enquiry created'));
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await enquiriesService.update(req.params.id, req.body);
    res.json(successResponse(data, 'Enquiry updated'));
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await enquiriesService.softDelete(req.params.id);
    res.json(successResponse(data));
  };
}

export const enquiriesController = new EnquiriesController();