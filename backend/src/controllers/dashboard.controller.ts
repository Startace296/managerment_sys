import { Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../types";

class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats(req.user!.role);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
