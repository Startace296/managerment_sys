import { employeeRepository } from "../repositories/employee.repository";
import { departmentRepository } from "../repositories/department.repository";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { EmployeeStatus, PaginatedResult, PaginationQuery } from "../types";
import { Employee } from "../entities/Employee";

interface CreateEmployeeDto {
  userId: number;
  departmentId?: number;
  employeeCode: string;
  dateOfBirth: Date;
  phone?: string;
  address?: string;
  salary: number;
  position: string;
  hireDate: Date;
}

interface UpdateEmployeeDto {
  departmentId?: number;
  phone?: string;
  address?: string;
  salary?: number;
  position?: string;
  status?: EmployeeStatus;
}

interface UpdateOwnProfileDto {
  phone?: string;
  address?: string;
}

interface EmployeeFilter extends PaginationQuery {
  departmentId?: number;
  status?: EmployeeStatus;
}

class EmployeeService {
  async getAll(query: EmployeeFilter): Promise<PaginatedResult<Employee>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const [data, total] = await employeeRepository.findAllPaginated(
      page,
      limit,
      query.search,
      query.departmentId,
      query.status
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: number): Promise<Employee> {
    const employee = await employeeRepository.findByIdWithRelations(id);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const user = await userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const codeExists = await employeeRepository.findByCode(dto.employeeCode);
    if (codeExists) {
      throw new AppError("Employee code already exists", 409);
    }

    const linkedEmployee = await employeeRepository.findByUserId(dto.userId);
    if (linkedEmployee) {
      throw new AppError("User already has an employee profile", 409);
    }

    const employee = employeeRepository.create({
      ...dto,
      user,
    });

    if (dto.departmentId) {
      const dept = await departmentRepository.findOne({
        where: { id: dto.departmentId },
      });
      if (!dept) throw new AppError("Department not found", 404);
      employee.department = dept;
    }

    return employeeRepository.save(employee);
  }

  async update(id: number, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await employeeRepository.findByIdWithRelations(id);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const { departmentId, ...rest } = dto;
    Object.assign(employee, rest);

    if (departmentId !== undefined) {
      if (departmentId === null) {
        employee.department = null as unknown as typeof employee.department;
      } else {
        const dept = await departmentRepository.findOne({
          where: { id: departmentId },
        });
        if (!dept) throw new AppError("Department not found", 404);
        employee.department = dept;
      }
    }

    return employeeRepository.save(employee);
  }

  async delete(id: number): Promise<void> {
    const employee = await employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    await employeeRepository.remove(employee);
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

  async getOwnProfile(userId: number): Promise<Employee> {
    return this.getEmployeeByUserId(userId);
  }

  async updateOwnProfile(
    userId: number,
    dto: UpdateOwnProfileDto
  ): Promise<Employee> {
    const employee = await this.getEmployeeByUserId(userId);
    Object.assign(employee, dto);
    return employeeRepository.save(employee);
  }
}

export const employeeService = new EmployeeService();
