import { employeeRepository } from "../repositories/employee.repository";
import { departmentRepository } from "../repositories/department.repository";
import { Employee } from "../entities/Employee";
import { EmployeeStatus } from "../types";

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalSalary: number;
  byStatus: Record<EmployeeStatus, number>;
  recentEmployees: Employee[];
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
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

    return {
      totalEmployees,
      totalDepartments,
      totalSalary: Number(salaryRow?.sum ?? 0),
      byStatus,
      recentEmployees,
    };
  }
}

export const dashboardService = new DashboardService();
