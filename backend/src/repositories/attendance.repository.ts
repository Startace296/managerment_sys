import { Between } from "typeorm";
import { AppDataSource } from "../config/database";
import { Attendance } from "../entities/Attendance";
import { AttendanceStatus } from "../types";

export interface AttendanceFilter {
  employeeId?: number;
  departmentId?: number;
  status?: AttendanceStatus;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  search?: string;
}

export const attendanceRepository = AppDataSource.getRepository(
  Attendance
).extend({
  findAllPaginated(page: number, limit: number, filter: AttendanceFilter) {
    const qb = this.createQueryBuilder("attendance")
      .leftJoinAndSelect("attendance.employee", "employee")
      .leftJoinAndSelect("employee.user", "user")
      .leftJoinAndSelect("employee.department", "department")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("attendance.workDate", "DESC")
      .addOrderBy("attendance.checkIn", "DESC");

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

    if (filter.status) {
      qb.andWhere("attendance.status = :status", { status: filter.status });
    }

    if (filter.from) {
      qb.andWhere("attendance.workDate >= :from", { from: filter.from });
    }

    if (filter.to) {
      qb.andWhere("attendance.workDate <= :to", { to: filter.to });
    }

    if (filter.search) {
      qb.andWhere(
        "(employee.employeeCode LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    return qb.getManyAndCount();
  },

  findByEmployeeAndDate(employeeId: number, workDate: string) {
    return this.createQueryBuilder("attendance")
      .leftJoin("attendance.employee", "employee")
      .where("employee.id = :employeeId", { employeeId })
      .andWhere("attendance.workDate = :workDate", { workDate })
      .getOne();
  },

  // from/to are inclusive "YYYY-MM-DD" bounds, e.g. the first/last day of a
  // payroll month.
  findByEmployeeAndDateRange(employeeId: number, from: string, to: string) {
    return this.find({
      where: {
        employee: { id: employeeId },
        workDate: Between(from, to),
      },
    });
  },
});
