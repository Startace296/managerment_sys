import { departmentRepository } from "../repositories/department.repository";
import { AppError } from "../utils/AppError";
import { PaginatedResult, PaginationQuery } from "../types";
import { Department } from "../entities/Department";

interface CreateDepartmentDto {
  name: string;
  description?: string;
  location?: string;
}

interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}

class DepartmentService {
  async getAll(query: PaginationQuery): Promise<PaginatedResult<Department>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const [data, total] = await departmentRepository.findAllPaginated(
      page,
      limit,
      query.search
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: number): Promise<Department> {
    const dept = await departmentRepository.findByIdWithEmployees(id);
    if (!dept) {
      throw new AppError("Department not found", 404);
    }
    return dept;
  }

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const existing = await departmentRepository.findByName(dto.name);
    if (existing) {
      throw new AppError("Department name already exists", 409);
    }

    const dept = departmentRepository.create(dto);
    return departmentRepository.save(dept);
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await departmentRepository.findOne({ where: { id } });
    if (!dept) {
      throw new AppError("Department not found", 404);
    }

    if (dto.name && dto.name !== dept.name) {
      const existing = await departmentRepository.findByName(dto.name);
      if (existing) {
        throw new AppError("Department name already exists", 409);
      }
    }

    Object.assign(dept, dto);
    return departmentRepository.save(dept);
  }

  async delete(id: number): Promise<void> {
    const dept = await departmentRepository.findByIdWithEmployees(id);
    if (!dept) {
      throw new AppError("Department not found", 404);
    }

    if (dept.employees && dept.employees.length > 0) {
      throw new AppError(
        "Cannot delete department with active employees",
        400
      );
    }

    await departmentRepository.remove(dept);
  }
}

export const departmentService = new DepartmentService();
