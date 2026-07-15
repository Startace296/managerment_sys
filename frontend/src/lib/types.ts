export type UserRole = "admin" | "manager" | "employee";
export type EmployeeStatus = "active" | "inactive" | "on_leave";
export type AttendanceStatus = "present" | "late";
export type LeaveType = "annual" | "sick" | "unpaid" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PayrollStatus = "draft" | "approved" | "paid";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
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

export interface Attendance {
  id: number;
  workDate: string;
  checkIn: string;
  checkOut: string | null;
  workedMinutes: number | null;
  status: AttendanceStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface TodayAttendance {
  hasProfile: boolean;
  record: Attendance | null;
}

export interface LeaveRequest {
  id: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy?: User | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface Payroll {
  id: number;
  month: number;
  year: number;
  baseSalary: string | number;
  standardWorkDays: number;
  actualWorkDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeMinutes: number;
  overtimePay: string | number;
  deductions: string | number;
  netSalary: string | number;
  status: PayrollStatus;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
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
  totalSalary?: number;
  byStatus: Record<EmployeeStatus, number>;
  recentEmployees: Omit<Employee, "salary">[];
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

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
};

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
  other: "Other",
};

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const PAYROLL_STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  paid: "Paid",
};

export const MONTH_LABEL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const formatVnd = (v: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v));

export const formatDate = (v: string | Date) =>
  new Date(v).toLocaleDateString("en-US");

export const formatTime = (v: string | Date) =>
  new Date(v).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const leaveDays = (startDate: string, endDate: string) => {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / 86_400_000) + 1;
};
