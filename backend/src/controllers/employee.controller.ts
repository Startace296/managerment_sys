import { Request, Response, NextFunction } from "express";
import { employeeService } from "../services/employee.service";
import { sendSuccess, sendPaginated } from "../utils/response";

class EmployeeController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.getAll(req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.getById(Number(req.params.id));
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.create(req.body);
      sendSuccess(res, employee, "Employee created", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.update(
        Number(req.params.id),
        req.body
      );
      sendSuccess(res, employee, "Employee updated");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await employeeService.delete(Number(req.params.id));
      sendSuccess(res, null, "Employee deleted");
    } catch (error) {
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
