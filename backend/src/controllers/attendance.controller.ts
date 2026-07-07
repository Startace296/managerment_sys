import { Response, NextFunction } from "express";
import { attendanceService } from "../services/attendance.service";
import { sendSuccess, sendPaginated } from "../utils/response";
import { AuthRequest } from "../types";

class AttendanceController {
  async checkIn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await attendanceService.checkIn(
        req.user!.userId,
        req.body?.note
      );
      sendSuccess(res, record, "Checked in", 201);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await attendanceService.checkOut(req.user!.userId);
      sendSuccess(res, record, "Checked out");
    } catch (error) {
      next(error);
    }
  }

  async getToday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = await attendanceService.getTodayStatus(req.user!.userId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.getMyHistory(
        req.user!.userId,
        req.query
      );
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.getAll(req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
