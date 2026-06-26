import { AppDataSource } from "../config/database";
import { Department } from "../entities/Department";

export const departmentRepository = AppDataSource.getRepository(
  Department
).extend({
  findAllPaginated(page: number, limit: number, search?: string) {
    const qb = this.createQueryBuilder("department")
      .loadRelationCountAndMap(
        "department.employeeCount",
        "department.employees"
      )
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("department.createdAt", "DESC");

    if (search) {
      qb.where(
        "department.name LIKE :search OR department.location LIKE :search",
        { search: `%${search}%` }
      );
    }

    return qb.getManyAndCount();
  },

  findByName(name: string) {
    return this.findOne({ where: { name } });
  },

  findByIdWithEmployees(id: number) {
    return this.findOne({
      where: { id },
      relations: ["employees", "employees.user"],
    });
  },
});
