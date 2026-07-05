export type UserRole = "admin" | "manager" | "employee";
export type EmployeeStatus = "active" | "inactive" | "on_leave";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employees?: Employee[];
}

export interface Employee {
  id: number;
  employeeCode: string;
  dateOfBirth: string;
  phone: string | null;
  address: string | null;
  salary: string | number;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
  department?: Department | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalSalary: number;
  byStatus: Record<EmployeeStatus, number>;
  recentEmployees: Employee[];
}

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On leave",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

export const formatVnd = (v: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v));

export const formatDate = (v: string | Date) =>
  new Date(v).toLocaleDateString("en-US");
