import { employeeRepository } from "../repositories/employee.repository";
import { departmentRepository } from "../repositories/department.repository";
import { Employee } from "../entities/Employee";
import { EmployeeStatus, UserRole } from "../types";

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalSalary?: number;
  byStatus: Record<EmployeeStatus, number>;
  recentEmployees: Omit<Employee, "salary">[] | Employee[];
}

const canViewSalary = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.MANAGER;

class DashboardService {
  async getStats(role: UserRole): Promise<DashboardStats> {
    const [totalEmployees, totalDepartments, salaryRow, statusRows, recentEmployees] =
      await Promise.all([
        employeeRepository.count(),
        departmentRepository.count(),
        employeeRepository
          .createQueryBuilder("employee")
          .select("COALESCE(SUM(employee.salary), 0)", "sum")
          .getRawOne<{ sum: string }>(),
        employeeRepository
          .createQueryBuilder("employee")
          .select("employee.status", "status")
          .addSelect("COUNT(*)", "count")
          .groupBy("employee.status")
          .getRawMany<{ status: EmployeeStatus; count: string }>(),
        employeeRepository.find({
          relations: ["user", "department"],
          order: { createdAt: "DESC" },
          take: 5,
        }),
      ]);

    const byStatus = Object.values(EmployeeStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<EmployeeStatus, number>
    );
    for (const row of statusRows) {
      byStatus[row.status] = Number(row.count);
    }

    const showSalary = canViewSalary(role);

    return {
      totalEmployees,
      totalDepartments,
      ...(showSalary && { totalSalary: Number(salaryRow?.sum ?? 0) }),
      byStatus,
      recentEmployees: showSalary
        ? recentEmployees
        : recentEmployees.map(({ salary: _salary, ...rest }) => rest),
    };
  }
}

export const dashboardService = new DashboardService();
