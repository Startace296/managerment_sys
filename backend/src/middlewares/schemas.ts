import { z } from "zod";
import { UserRole, EmployeeStatus } from "../types";

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
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

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

export const employeeQuerySchema = paginationSchema.extend({
  departmentId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});
