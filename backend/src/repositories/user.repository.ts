import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

export const userRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  },

  findByEmailWithPassword(email: string) {
    return this.createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  },

  findByIdWithRefreshToken(id: number) {
    return this.createQueryBuilder("user")
      .addSelect("user.refreshToken")
      .where("user.id = :id", { id })
      .getOne();
  },

  findByIdWithPassword(id: number) {
    return this.createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id })
      .getOne();
  },

  findByResetToken(hashedToken: string) {
    return this.createQueryBuilder("user")
      .addSelect(["user.resetPasswordToken", "user.resetPasswordExpires"])
      .where("user.resetPasswordToken = :hashedToken", { hashedToken })
      .getOne();
  },

  findByIdWithEmployee(id: number) {
    return this.findOne({
      where: { id },
      relations: ["employee", "employee.department"],
    });
  },

  findAllPaginated(page: number, limit: number, search?: string) {
    const qb = this.createQueryBuilder("user")
      .leftJoinAndSelect("user.employee", "employee")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("user.createdAt", "DESC");

    if (search) {
      qb.where(
        "user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search",
        { search: `%${search}%` }
      );
    }

    return qb.getManyAndCount();
  },

  findAvailableForEmployee(search?: string) {
    const qb = this.createQueryBuilder("user")
      .leftJoin("user.employee", "employee")
      .where("employee.id IS NULL")
      .andWhere("user.isActive = true")
      .orderBy("user.createdAt", "DESC");

    if (search) {
      qb.andWhere(
        "(user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)",
        { search: `%${search}%` }
      );
    }

    return qb.getMany();
  },
});
