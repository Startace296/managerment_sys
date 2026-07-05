import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateUserRoleSchema } from "../middlewares/schemas";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get(
  "/available",
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  userController.getAvailable
);

router.patch(
  "/:id/role",
  authorize(UserRole.ADMIN),
  validate(updateUserRoleSchema),
  userController.updateRole
);

export default router;
