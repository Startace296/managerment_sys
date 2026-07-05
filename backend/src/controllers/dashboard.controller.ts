import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
