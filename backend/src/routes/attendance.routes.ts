import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  attendanceQuerySchema,
  checkInSchema,
} from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// Self-service (any authenticated user with an employee profile)
router.post("/check-in", validate(checkInSchema), attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);
router.get("/me/today", attendanceController.getToday);
router.get(
  "/me",
  validate(attendanceQuerySchema, "query"),
  attendanceController.getMine
);

// Management view
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(attendanceQuerySchema, "query"),
  attendanceController.getAll
);

export default router;
