import { AppDataSource } from "../config/database";
import { LeaveRequest } from "../entities/LeaveRequest";
import { LeaveStatus, LeaveType } from "../types";

export interface LeaveRequestFilter {
  employeeId?: number;
  departmentId?: number;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  search?: string;
}

export const leaveRequestRepository = AppDataSource.getRepository(
  LeaveRequest
).extend({
  findAllPaginated(page: number, limit: number, filter: LeaveRequestFilter) {
    const qb = this.createQueryBuilder("leaveRequest")
      .leftJoinAndSelect("leaveRequest.employee", "employee")
      .leftJoinAndSelect("employee.user", "user")
      .leftJoinAndSelect("employee.department", "department")
      .leftJoinAndSelect("leaveRequest.reviewedBy", "reviewedBy")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("leaveRequest.createdAt", "DESC");

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
      qb.andWhere("leaveRequest.status = :status", { status: filter.status });
    }

    if (filter.leaveType) {
      qb.andWhere("leaveRequest.leaveType = :leaveType", {
        leaveType: filter.leaveType,
      });
    }

    if (filter.from) {
      qb.andWhere("leaveRequest.endDate >= :from", { from: filter.from });
    }

    if (filter.to) {
      qb.andWhere("leaveRequest.startDate <= :to", { to: filter.to });
    }

    if (filter.search) {
      qb.andWhere(
        "(employee.employeeCode LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    return qb.getManyAndCount();
  },

  findByIdWithRelations(id: number) {
    return this.findOne({
      where: { id },
      relations: [
        "employee",
        "employee.user",
        "employee.department",
        "reviewedBy",
      ],
    });
  },

  // Approved leave requests that overlap the ["from", "to"] range at all
  // (a request may start/end outside the range, e.g. straddling two payroll
  // months) — the caller is responsible for clipping to the range.
  findApprovedOverlapping(employeeId: number, from: string, to: string) {
    return this.createQueryBuilder("leaveRequest")
      .leftJoin("leaveRequest.employee", "employee")
      .where("employee.id = :employeeId", { employeeId })
      .andWhere("leaveRequest.status = :status", {
        status: LeaveStatus.APPROVED,
      })
      .andWhere("leaveRequest.startDate <= :to", { to })
      .andWhere("leaveRequest.endDate >= :from", { from })
      .getMany();
  },
});
