import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { customersService } from './customers.service';

export class CustomersController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await customersService.list(req.query as never);
    res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await customersService.getById(req.params.id);
    res.json(successResponse(data));
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await customersService.create(req.body);
    res.status(201).json(successResponse(data, 'Customer created'));
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await customersService.update(req.params.id, req.body);
    res.json(successResponse(data, 'Customer updated'));
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await customersService.softDelete(req.params.id);
    res.json(successResponse(data));
  };

  history = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await customersService.repairHistory(req.params.id);
    res.json(successResponse(data));
  };
}

export const customersController = new CustomersController();
