import {
  payrollRepository,
  PayrollFilter,
} from "../repositories/payroll.repository";
import { employeeRepository } from "../repositories/employee.repository";
import { attendanceRepository } from "../repositories/attendance.repository";
import { leaveRequestRepository } from "../repositories/leaveRequest.repository";
import { AppError } from "../utils/AppError";
import {
  LeaveType,
  PaginatedResult,
  PaginationQuery,
  PayrollStatus,
} from "../types";
import { Payroll } from "../entities/Payroll";
import { Employee } from "../entities/Employee";

interface PayrollQuery extends PaginationQuery, PayrollFilter {}

// Standard workday used for both the overtime threshold and the hourly rate
const STANDARD_WORK_HOURS_PER_DAY = 8;
const STANDARD_WORK_MINUTES_PER_DAY = STANDARD_WORK_HOURS_PER_DAY * 60;
const OVERTIME_MULTIPLIER = 1.5;

const pad2 = (n: number): string => String(n).padStart(2, "0");

const toDateString = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Inclusive count of Mon-Fri days between from/to 
const countWeekdays = (from: Date, to: Date): number => {
  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    if (!isWeekend(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

class PayrollService {
  private async getEmployeeOrThrow(employeeId: number): Promise<Employee> {
    const employee = await employeeRepository.findOne({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    return employee;
  }

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

  private async getOrThrow(id: number): Promise<Payroll> {
    const payroll = await payrollRepository.findByIdWithRelations(id);
    if (!payroll) {
      throw new AppError("Payroll record not found", 404);
    }
    return payroll;
  }

  // standardWorkDays counts every weekday in the month regardless of whether
  // it has happened yet, so generating payroll before the month is over
  // would count the remaining days as unpaid absence.
  private assertMonthHasEnded(month: number, year: number): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const hasEnded =
      year < currentYear || (year === currentYear && month < currentMonth);
    if (!hasEnded) {
      throw new AppError(
        `Cannot generate payroll for ${month}/${year} until that month has ended`,
        422
      );
    }
  }

  private async calculate(
    employee: Employee,
    month: number,
    year: number
  ): Promise<Payroll> {
    const existing = await payrollRepository.findByEmployeeAndMonth(
      employee.id,
      month,
      year
    );
    if (existing && existing.status !== PayrollStatus.DRAFT) {
      throw new AppError(
        `Payroll for ${month}/${year} is already ${existing.status} and cannot be recalculated`,
        409
      );
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const from = toDateString(monthStart);
    const to = toDateString(monthEnd);

    const standardWorkDays = countWeekdays(monthStart, monthEnd);

    const attendances = await attendanceRepository.findByEmployeeAndDateRange(
      employee.id,
      from,
      to
    );
    const actualWorkDays = attendances.length;
    const overtimeMinutes = attendances.reduce(
      (sum, a) =>
        sum + Math.max(0, (a.workedMinutes ?? 0) - STANDARD_WORK_MINUTES_PER_DAY),
      0
    );

    const approvedLeaves = await leaveRequestRepository.findApprovedOverlapping(
      employee.id,
      from,
      to
    );
    const paidLeaveDays = approvedLeaves
      .filter((leave) => leave.leaveType !== LeaveType.UNPAID)
      .reduce((sum, leave) => {
        const start = new Date(
          Math.max(new Date(leave.startDate).getTime(), monthStart.getTime())
        );
        const end = new Date(
          Math.min(new Date(leave.endDate).getTime(), monthEnd.getTime())
        );
        return sum + countWeekdays(start, end);
      }, 0);

    const unpaidLeaveDays = Math.max(
      0,
      standardWorkDays - actualWorkDays - paidLeaveDays
    );

    const baseSalary = Number(employee.salary);
    const dailyRate = standardWorkDays > 0 ? baseSalary / standardWorkDays : 0;
    const overtimePay =
      (overtimeMinutes / 60) *
      (dailyRate / STANDARD_WORK_HOURS_PER_DAY) *
      OVERTIME_MULTIPLIER;
    const deductions = unpaidLeaveDays * dailyRate;
    const netSalary = baseSalary - deductions + overtimePay;

    const payrollData = {
      employee,
      month,
      year,
      baseSalary,
      standardWorkDays,
      actualWorkDays,
      paidLeaveDays,
      unpaidLeaveDays,
      overtimeMinutes,
      overtimePay,
      deductions,
      netSalary,
      status: PayrollStatus.DRAFT,
    };

    if (existing) {
      Object.assign(existing, payrollData);
      return payrollRepository.save(existing);
    }
    return payrollRepository.save(payrollRepository.create(payrollData));
  }

  async generateForEmployee(
    employeeId: number,
    month: number,
    year: number
  ): Promise<Payroll> {
    this.assertMonthHasEnded(month, year);
    const employee = await this.getEmployeeOrThrow(employeeId);
    return this.calculate(employee, month, year);
  }

  async generateForMonth(month: number, year: number): Promise<Payroll[]> {
    this.assertMonthHasEnded(month, year);
    const employees = await employeeRepository.findAllActive();
    const results: Payroll[] = [];

    for (const employee of employees) {
      try {
        results.push(await this.calculate(employee, month, year));
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 409) {
          continue;
        }
        throw err;
      }
    }

    return results;
  }

  async getMine(
    userId: number,
    query: PayrollQuery
  ): Promise<PaginatedResult<Payroll>> {
    const employee = await this.getEmployeeByUserId(userId);
    return this.getAll({ ...query, employeeId: employee.id });
  }

  async getAll(query: PayrollQuery): Promise<PaginatedResult<Payroll>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const [data, total] = await payrollRepository.findAllPaginated(
      page,
      limit,
      {
        employeeId: query.employeeId,
        departmentId: query.departmentId,
        month: query.month,
        year: query.year,
        status: query.status,
      }
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  getById(id: number): Promise<Payroll> {
    return this.getOrThrow(id);
  }

  async approve(id: number): Promise<Payroll> {
    const payroll = await this.getOrThrow(id);
    if (payroll.status !== PayrollStatus.DRAFT) {
      throw new AppError("Only draft payroll can be approved", 409);
    }
    payroll.status = PayrollStatus.APPROVED;
    return payrollRepository.save(payroll);
  }

  async markPaid(id: number): Promise<Payroll> {
    const payroll = await this.getOrThrow(id);
    if (payroll.status !== PayrollStatus.APPROVED) {
      throw new AppError("Only approved payroll can be marked as paid", 409);
    }
    payroll.status = PayrollStatus.PAID;
    return payrollRepository.save(payroll);
  }
}

export const payrollService = new PayrollService();
