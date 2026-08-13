import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { successResponse } from '../common/utils/pagination';
import { stagesService } from './stages.service';

export class StagesController {
  list = async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await stagesService.list()));
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await stagesService.getById(req.params.id)));
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    res.status(201).json(successResponse(await stagesService.create(req.body), 'Stage created'));
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await stagesService.update(req.params.id, req.body), 'Stage updated'));
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await stagesService.softDelete(req.params.id)));
  };

  reorder = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await stagesService.reorder(req.body.orderedIds), 'Stages reordered'));
  };
}

export const stagesController = new StagesController();
