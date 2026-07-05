import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/", validate(employeeQuerySchema, "query"), employeeController.getAll);
router.get("/:id", employeeController.getById);

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
