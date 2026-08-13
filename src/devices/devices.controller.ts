import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { devicesService } from './devices.service';

export class DevicesController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await devicesService.list(req.query as never);
    res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await devicesService.getById(req.params.id)));
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    res.status(201).json(successResponse(await devicesService.create(req.body), 'Device created'));
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await devicesService.update(req.params.id, req.body), 'Device updated'));
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json(successResponse(await devicesService.softDelete(req.params.id)));
  };
}

export const devicesController = new DevicesController();
