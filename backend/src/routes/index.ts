import { Router } from "express";
import authRoutes from "./auth.routes";
import departmentRoutes from "./department.routes";
import employeeRoutes from "./employee.routes";
import userRoutes from "./user.routes";
import dashboardRoutes from "./dashboard.routes";
import attendanceRoutes from "./attendance.routes";
import leaveRequestRoutes from "./leaveRequest.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/employees", employeeRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leave-requests", leaveRequestRoutes);

export default router;
