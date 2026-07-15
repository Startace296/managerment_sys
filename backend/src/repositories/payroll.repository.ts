import { AppDataSource } from "../config/database";
import { Payroll } from "../entities/Payroll";
import { PayrollStatus } from "../types";

export interface PayrollFilter {
  employeeId?: number;
  departmentId?: number;
  month?: number;
  year?: number;
  status?: PayrollStatus;
}

export const payrollRepository = AppDataSource.getRepository(Payroll).extend({
  findByEmployeeAndMonth(employeeId: number, month: number, year: number) {
    return this.createQueryBuilder("payroll")
      .leftJoin("payroll.employee", "employee")
      .where("employee.id = :employeeId", { employeeId })
      .andWhere("payroll.month = :month", { month })
      .andWhere("payroll.year = :year", { year })
      .getOne();
  },

  findAllPaginated(page: number, limit: number, filter: PayrollFilter) {
    const qb = this.createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("employee.user", "user")
      .leftJoinAndSelect("employee.department", "department")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("payroll.year", "DESC")
      .addOrderBy("payroll.month", "DESC")
      .addOrderBy("payroll.id", "DESC");

    if (filter.employeeId) {
      qb.andWhere("employee.id = :employeeId", {
        employeeId: filter.employeeId,
      });
    }

    if (filter.departmentId) {
      qb.andWhere("department.id = :departmentId", {
        departmentId: filter.departmentId,
      });
    }

    if (filter.month) {
      qb.andWhere("payroll.month = :month", { month: filter.month });
    }

    if (filter.year) {
      qb.andWhere("payroll.year = :year", { year: filter.year });
    }

    if (filter.status) {
      qb.andWhere("payroll.status = :status", { status: filter.status });
    }

    return qb.getManyAndCount();
  },

  findByIdWithRelations(id: number) {
    return this.findOne({
      where: { id },
      relations: ["employee", "employee.user", "employee.department"],
    });
  },
});
