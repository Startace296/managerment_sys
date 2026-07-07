import { QueryFailedError } from "typeorm";
import {
  attendanceRepository,
  AttendanceFilter,
} from "../repositories/attendance.repository";
import { employeeRepository } from "../repositories/employee.repository";
import { AppError } from "../utils/AppError";
import { AttendanceStatus, PaginatedResult, PaginationQuery } from "../types";
import { Attendance } from "../entities/Attendance";
import { Employee } from "../entities/Employee";

const isDuplicateEntryError = (err: unknown): boolean =>
  err instanceof QueryFailedError &&
  (err.driverError as { code?: string } | undefined)?.code === "ER_DUP_ENTRY";

// Work day starts at 09:00 (server local time). Check-ins after the grace
// period are marked as late.
const WORK_START = { hour: 9, minute: 0 };
const LATE_GRACE_MINUTES = 5;

const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface AttendanceQuery extends PaginationQuery, AttendanceFilter {}

interface TodayStatus {
  hasProfile: boolean;
  record: Attendance | null;
}

class AttendanceService {
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

  async checkIn(userId: number, note?: string): Promise<Attendance> {
    const employee = await this.getEmployeeByUserId(userId);
    const now = new Date();
    const today = toDateString(now);

    const existing = await attendanceRepository.findByEmployeeAndDate(
      employee.id,
      today
    );
    if (existing) {
      throw new AppError("You have already checked in today", 409);
    }

    const workStart = new Date(now);
    workStart.setHours(WORK_START.hour, WORK_START.minute, 0, 0);
    const lateThreshold = new Date(
      workStart.getTime() + LATE_GRACE_MINUTES * 60_000
    );

    const attendance = attendanceRepository.create({
      employee,
      workDate: today,
      checkIn: now,
      status:
        now > lateThreshold ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      note: note ?? null,
    });

    try {
      return await attendanceRepository.save(attendance);
    } catch (err) {
      if (isDuplicateEntryError(err)) {
        throw new AppError("You have already checked in today", 409);
      }
      throw err;
    }
  }

  async checkOut(userId: number): Promise<Attendance> {
    const employee = await this.getEmployeeByUserId(userId);
    const now = new Date();
    const today = toDateString(now);

    const attendance = await attendanceRepository.findByEmployeeAndDate(
      employee.id,
      today
    );
    if (!attendance) {
      throw new AppError("You have not checked in today", 400);
    }
    if (attendance.checkOut) {
      throw new AppError("You have already checked out today", 409);
    }

    attendance.checkOut = now;
    attendance.workedMinutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(attendance.checkIn).getTime()) / 60_000)
    );

    return attendanceRepository.save(attendance);
  }

  async getTodayStatus(userId: number): Promise<TodayStatus> {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      return { hasProfile: false, record: null };
    }
    const record = await attendanceRepository.findByEmployeeAndDate(
      employee.id,
      toDateString(new Date())
    );
    return { hasProfile: true, record };
  }

  async getMyHistory(
    userId: number,
    query: AttendanceQuery
  ): Promise<PaginatedResult<Attendance>> {
    const employee = await this.getEmployeeByUserId(userId);
    return this.getAll({ ...query, employeeId: employee.id });
  }

  async getAll(query: AttendanceQuery): Promise<PaginatedResult<Attendance>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const [data, total] = await attendanceRepository.findAllPaginated(
      page,
      limit,
      {
        employeeId: query.employeeId,
        departmentId: query.departmentId,
        status: query.status,
        from: query.from,
        to: query.to,
        search: query.search,
      }
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const attendanceService = new AttendanceService();
