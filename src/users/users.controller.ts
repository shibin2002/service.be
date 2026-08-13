import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { paginatedResponse, successResponse } from '../common/utils/pagination';
import { usersService } from './users.service';

export class UsersController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await usersService.list(req.query as never);
    res.json(paginatedResponse(result.data, result.total, result.page, result.limit));
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await usersService.getById(req.params.id);
    res.json(successResponse(user));
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await usersService.create(req.body, req.user?.role);
    res.status(201).json(successResponse(user, 'User created'));
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await usersService.update(req.params.id, req.body, req.user);
    res.json(successResponse(user, 'User updated'));
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await usersService.softDelete(req.params.id, req.user);
    res.json(successResponse(result));
  };

  technicians = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await usersService.listTechnicians(req.user);
    res.json(successResponse(data));
  };
}

export const usersController = new UsersController();
