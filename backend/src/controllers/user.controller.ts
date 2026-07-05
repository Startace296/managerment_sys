import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { sendSuccess } from "../utils/response";

class UserController {
  async getAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const users = await userService.getAvailableForEmployee(search);
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateRole(
        Number(req.params.id),
        req.body.role
      );
      sendSuccess(res, user, "Role updated");
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
