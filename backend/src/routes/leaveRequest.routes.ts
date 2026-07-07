import { Router } from "express";
import { leaveRequestController } from "../controllers/leaveRequest.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createLeaveRequestSchema,
  leaveRequestQuerySchema,
  reviewLeaveRequestSchema,
} from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// Self-service (any authenticated user with an employee profile)
router.post(
  "/",
  validate(createLeaveRequestSchema),
  leaveRequestController.create
);
router.get(
  "/me",
  validate(leaveRequestQuerySchema, "query"),
  leaveRequestController.getMine
);
router.patch("/:id/cancel", leaveRequestController.cancel);

// Management view
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(leaveRequestQuerySchema, "query"),
  leaveRequestController.getAll
);
router.patch(
  "/:id/approve",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(reviewLeaveRequestSchema),
  leaveRequestController.approve
);
router.patch(
  "/:id/reject",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(reviewLeaveRequestSchema),
  leaveRequestController.reject
);

export default router;
