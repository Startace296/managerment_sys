import { Router } from "express";
import { payrollController } from "../controllers/payroll.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  generatePayrollSchema,
  payrollQuerySchema,
} from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// Self-service (any authenticated user with an employee profile)
router.get(
  "/me",
  validate(payrollQuerySchema, "query"),
  payrollController.getMine
);

// Management
router.post(
  "/generate",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(generatePayrollSchema),
  payrollController.generateForMonth
);
router.post(
  "/generate/:employeeId",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(generatePayrollSchema),
  payrollController.generateForEmployee
);
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(payrollQuerySchema, "query"),
  payrollController.getAll
);
router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  payrollController.getById
);
router.patch(
  "/:id/approve",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  payrollController.approve
);
router.patch(
  "/:id/pay",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  payrollController.markPaid
);

export default router;
