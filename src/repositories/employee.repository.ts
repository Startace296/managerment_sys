import { AppDataSource } from "../config/database";
import { Employee } from "../entities/Employee";
import { EmployeeStatus } from "../types";

export const employeeRepository = AppDataSource.getRepository(Employee).extend({
  findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    departmentId?: number,
    status?: EmployeeStatus
  ) {
    const qb = this.createQueryBuilder("employee")
      .leftJoinAndSelect("employee.user", "user")
      .leftJoinAndSelect("employee.department", "department")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("employee.createdAt", "DESC");

    if (search) {
      qb.andWhere(
        "employee.employeeCode LIKE :search OR employee.position LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search",
        { search: `%${search}%` }
      );
    }

    if (departmentId) {
      qb.andWhere("department.id = :departmentId", { departmentId });
    }

    if (status) {
      qb.andWhere("employee.status = :status", { status });
    }

    return qb.getManyAndCount();
  },

  findByCode(employeeCode: string) {
    return this.findOne({ where: { employeeCode } });
  },

  findByIdWithRelations(id: number) {
    return this.findOne({
      where: { id },
      relations: ["user", "department"],
    });
  },

  findByUserId(userId: number) {
    return this.createQueryBuilder("employee")
      .leftJoinAndSelect("employee.user", "user")
      .leftJoinAndSelect("employee.department", "department")
      .where("user.id = :userId", { userId })
      .getOne();
  },
});
