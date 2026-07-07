import { Response, NextFunction } from "express";
import { leaveRequestService } from "../services/leaveRequest.service";
import { sendSuccess, sendPaginated } from "../utils/response";
import { AuthRequest } from "../types";

class LeaveRequestController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveRequestService.create(
        req.user!.userId,
        req.body
      );
      sendSuccess(res, request, "Leave request submitted", 201);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await leaveRequestService.getMine(
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
      const result = await leaveRequestService.getAll(req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveRequestService.cancel(
        req.user!.userId,
        Number(req.params.id)
      );
      sendSuccess(res, request, "Leave request cancelled");
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveRequestService.approve(
        Number(req.params.id),
        req.user!.userId,
        req.body?.note
      );
      sendSuccess(res, request, "Leave request approved");
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await leaveRequestService.reject(
        Number(req.params.id),
        req.user!.userId,
        req.body?.note
      );
      sendSuccess(res, request, "Leave request rejected");
    } catch (error) {
      next(error);
    }
  }
}

export const leaveRequestController = new LeaveRequestController();
