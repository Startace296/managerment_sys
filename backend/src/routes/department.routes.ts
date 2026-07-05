import { Router } from "express";
import { departmentController } from "../controllers/department.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  paginationSchema,
} from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/", validate(paginationSchema, "query"), departmentController.getAll);
router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  departmentController.getById
);

router.post(
  "/",
  authorize(UserRole.ADMIN),
  validate(createDepartmentSchema),
  departmentController.create
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN),
  validate(updateDepartmentSchema),
  departmentController.update
);

router.delete("/:id", authorize(UserRole.ADMIN), departmentController.delete);

export default router;
