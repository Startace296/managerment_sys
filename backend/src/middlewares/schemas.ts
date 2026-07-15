import { z } from "zod";
import {
  UserRole,
  EmployeeStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  PayrollStatus,
} from "../types";

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  location: z.string().max(100).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  location: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const createEmployeeSchema = z.object({
  userId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional(),
  employeeCode: z.string().min(1).max(20),
  dateOfBirth: z.coerce.date(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  salary: z.number().nonnegative(),
  position: z.string().min(1).max(100),
  hireDate: z.coerce.date(),
});

export const updateEmployeeSchema = z.object({
  departmentId: z.number().int().positive().nullable().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  salary: z.number().nonnegative().optional(),
  position: z.string().max(100).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export const updateOwnProfileSchema = z.object({
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

export const employeeQuerySchema = paginationSchema.extend({
  departmentId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export const checkInSchema = z.object({
  note: z.string().max(500).optional(),
});

export const attendanceQuerySchema = paginationSchema.extend({
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const createLeaveRequestSchema = z
  .object({
    leaveType: z.nativeEnum(LeaveType),
    startDate: isoDate,
    endDate: isoDate,
    reason: z.string().min(1).max(500),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

export const reviewLeaveRequestSchema = z.object({
  note: z.string().max(500).optional(),
});

export const leaveRequestQuerySchema = paginationSchema.extend({
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  leaveType: z.nativeEnum(LeaveType).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const generatePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const payrollQuerySchema = paginationSchema.extend({
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.nativeEnum(PayrollStatus).optional(),
});
