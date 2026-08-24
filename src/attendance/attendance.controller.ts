import { Response } from 'express';
import { AuthRequest } from '../common/middleware/auth.middleware';
import { successResponse } from '../common/utils/pagination';
import { attendanceService } from './attendance.service';

export class AttendanceController {
  mark = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await attendanceService.mark(req.body, req.user!.sub);
    res.json(successResponse(result, 'Attendance marked'));
  };

  bulkMark = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await attendanceService.bulkMark(req.body, req.user!.sub);
    res.json(successResponse(result, 'Attendance marked'));
  };

  getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year } = req.query as { month?: string; year?: string };
    const result = await attendanceService.getMyAttendance(req.user!.sub, month, year);
    res.json(successResponse(result));
  };

  getStaffAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year, userId } = req.query as { month?: string; year?: string; userId?: string };
    const result = await attendanceService.getStaffAttendance(req.user!.sub, month, year, userId);
    res.json(successResponse(result));
  };

  getAllAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year, userId } = req.query as { month?: string; year?: string; userId?: string };
    const result = await attendanceService.getAllAttendance(req.user!.sub, month, year, userId);
    res.json(successResponse(result));
  };

  getMarkableUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await attendanceService.getMarkableUsers(req.user!.sub);
    res.json(successResponse(result));
  };
}

export const attendanceController = new AttendanceController();
