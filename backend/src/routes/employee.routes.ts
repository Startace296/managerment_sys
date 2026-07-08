import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateOwnProfileSchema,
  employeeQuerySchema,
} from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// Self-service (any authenticated user with an employee profile)
router.get("/me", employeeController.getMe);
router.put(
  "/me",
  validate(updateOwnProfileSchema),
  employeeController.updateMe
);

router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(employeeQuerySchema, "query"),
  employeeController.getAll
);
router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  employeeController.getById
);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(createEmployeeSchema),
  employeeController.create
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(updateEmployeeSchema),
  employeeController.update
);

router.delete("/:id", authorize(UserRole.ADMIN), employeeController.delete);

export default router;
