import { Request, Response, NextFunction } from "express";
import { departmentService } from "../services/department.service";
import { sendSuccess, sendPaginated } from "../utils/response";

class DepartmentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await departmentService.getAll(req.query);
      sendPaginated(
        res,
        result.data,
        result.total,
        result.page,
        result.limit
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await departmentService.getById(Number(req.params.id));
      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await departmentService.create(req.body);
      sendSuccess(res, dept, "Department created", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await departmentService.update(
        Number(req.params.id),
        req.body
      );
      sendSuccess(res, dept, "Department updated");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await departmentService.delete(Number(req.params.id));
      sendSuccess(res, null, "Department deleted");
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
