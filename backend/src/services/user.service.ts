import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { User } from "../entities/User";
import { UserRole } from "../types";

class UserService {
  async getAvailableForEmployee(search?: string): Promise<User[]> {
    return userRepository.findAvailableForEmployee(search);
  }

  async updateRole(id: number, role: UserRole): Promise<User> {
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.role = role;
    await userRepository.save(user);

    const { refreshToken: _, ...safe } = user;
    return safe as User;
  }
}

export const userService = new UserService();
