import {
  leaveRequestRepository,
  LeaveRequestFilter,
} from "../repositories/leaveRequest.repository";
import { employeeRepository } from "../repositories/employee.repository";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import {
  LeaveStatus,
  LeaveType,
  PaginatedResult,
  PaginationQuery,
} from "../types";
import { LeaveRequest } from "../entities/LeaveRequest";
import { Employee } from "../entities/Employee";

interface LeaveRequestQuery extends PaginationQuery, LeaveRequestFilter {}

interface CreateLeaveRequestDto {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

class LeaveRequestService {
  private async getEmployeeByUserId(userId: number): Promise<Employee> {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError(
        "No employee profile is linked to your account",
        404
      );
    }
    return employee;
  }

  private async getOrThrow(id: number): Promise<LeaveRequest> {
    const request = await leaveRequestRepository.findByIdWithRelations(id);
    if (!request) {
      throw new AppError("Leave request not found", 404);
    }
    return request;
  }

  async create(
    userId: number,
    dto: CreateLeaveRequestDto
  ): Promise<LeaveRequest> {
    const employee = await this.getEmployeeByUserId(userId);

    const leaveRequest = leaveRequestRepository.create({
      employee,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
    });

    return leaveRequestRepository.save(leaveRequest);
  }

  async getMine(
    userId: number,
    query: LeaveRequestQuery
  ): Promise<PaginatedResult<LeaveRequest>> {
    const employee = await this.getEmployeeByUserId(userId);
    return this.getAll({ ...query, employeeId: employee.id });
  }

  async getAll(
    query: LeaveRequestQuery
  ): Promise<PaginatedResult<LeaveRequest>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const [data, total] = await leaveRequestRepository.findAllPaginated(
      page,
      limit,
      {
        employeeId: query.employeeId,
        departmentId: query.departmentId,
        status: query.status,
        leaveType: query.leaveType,
        from: query.from,
        to: query.to,
        search: query.search,
      }
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancel(userId: number, id: number): Promise<LeaveRequest> {
    const employee = await this.getEmployeeByUserId(userId);
    const request = await this.getOrThrow(id);

    if (request.employee.id !== employee.id) {
      throw new AppError("You can only cancel your own leave requests", 403);
    }
    if (request.status !== LeaveStatus.PENDING) {
      throw new AppError("Only pending requests can be cancelled", 409);
    }

    request.status = LeaveStatus.CANCELLED;
    return leaveRequestRepository.save(request);
  }

  private async review(
    id: number,
    reviewerUserId: number,
    status: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
    note?: string
  ): Promise<LeaveRequest> {
    const request = await this.getOrThrow(id);
    if (request.status !== LeaveStatus.PENDING) {
      throw new AppError("This request has already been reviewed", 409);
    }

    const reviewer = await userRepository.findOne({
      where: { id: reviewerUserId },
    });
    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    request.status = status;
    request.reviewNote = note ?? null;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewer;

    return leaveRequestRepository.save(request);
  }

  approve(
    id: number,
    reviewerUserId: number,
    note?: string
  ): Promise<LeaveRequest> {
    return this.review(id, reviewerUserId, LeaveStatus.APPROVED, note);
  }

  reject(
    id: number,
    reviewerUserId: number,
    note?: string
  ): Promise<LeaveRequest> {
    return this.review(id, reviewerUserId, LeaveStatus.REJECTED, note);
  }
}

export const leaveRequestService = new LeaveRequestService();
