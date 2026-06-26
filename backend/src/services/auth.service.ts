import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { JwtPayload, UserRole } from "../types";
import { User } from "../entities/User";

interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface LoginDto {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private generateTokens(payload: JwtPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto): Promise<Omit<User, "password">> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError("Email already in use", 409);
    }

    const hashed = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    const user = userRepository.create({
      ...dto,
      password: hashed,
      role: dto.role ?? UserRole.EMPLOYEE,
    });

    await userRepository.save(user);

    const { password: _, ...result } = user as User & { password: string };
    return result;
  }

  async login(dto: LoginDto): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const user = await userRepository.findByEmailWithPassword(dto.email);

    if (!user || !user.isActive) {
      throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    user.refreshToken = tokens.refreshToken;
    await userRepository.save(user);

    const { password: _, refreshToken: __, ...safeUser } = user as User & {
      password: string;
    };

    return { user: safeUser, tokens };
  }

  async refreshToken(token: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await userRepository.findOne({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token) {
      throw new AppError("Refresh token revoked", 401);
    }

    const newPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(newPayload);
    user.refreshToken = tokens.refreshToken;
    await userRepository.save(user);

    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await userRepository.update(userId, { refreshToken: "" });
  }
}

export const authService = new AuthService();
