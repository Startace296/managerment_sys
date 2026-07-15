import { Response, NextFunction } from "express";
import { payrollService } from "../services/payroll.service";
import { sendSuccess, sendPaginated } from "../utils/response";
import { AuthRequest } from "../types";

class PayrollController {
  async generateForMonth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.body;
      const results = await payrollService.generateForMonth(month, year);
      sendSuccess(
        res,
        results,
        `Generated payroll for ${results.length} employee(s)`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async generateForEmployee(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { month, year } = req.body;
      const result = await payrollService.generateForEmployee(
        Number(req.params.employeeId),
        month,
        year
      );
      sendSuccess(res, result, "Payroll generated", 201);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getMine(req.user!.userId, req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getAll(req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getById(Number(req.params.id));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.approve(Number(req.params.id));
      sendSuccess(res, result, "Payroll approved");
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.markPaid(Number(req.params.id));
      sendSuccess(res, result, "Payroll marked as paid");
    } catch (error) {
      next(error);
    }
  }
}

export const payrollController = new PayrollController();
