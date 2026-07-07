import { Request } from "express";

export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
}

export enum EmployeeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_LEAVE = "on_leave",
}

export enum AttendanceStatus {
  PRESENT = "present",
  LATE = "late",
}

export enum LeaveType {
  ANNUAL = "annual",
  SICK = "sick",
  UNPAID = "unpaid",
  OTHER = "other",
}

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
