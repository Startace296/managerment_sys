import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { sendPasswordResetEmail, sendOtpEmail } from "../utils/mailer";
import { JwtPayload, UserRole } from "../types";
import { User } from "../entities/User";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateOtp = (): string =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

  async register(dto: RegisterDto): Promise<Omit<User, "password" | "otpCode">> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError("Email already in use", 409);
    }

    const hashed = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    // The first account in the system automatically becomes admin; every
    // account after that is always employee — a higher role can only be
    // granted by an admin via PATCH /users/:id/role, never from the
    // client at registration time.
    const userCount = await userRepository.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.EMPLOYEE;

    const otp = generateOtp();

    const user = userRepository.create({
      ...dto,
      password: hashed,
      role,
      isEmailVerified: false,
      otpCode: hashToken(otp),
      otpExpires: new Date(Date.now() + OTP_TTL_MS),
    });

    await userRepository.save(user);
    await sendOtpEmail(user.email, otp);

    const { password: _, otpCode: __, ...result } = user as User & {
      password: string;
    };
    return result;
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    const user = await userRepository.findByEmailWithOtp(email);
    if (!user) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    if (user.isEmailVerified) {
      throw new AppError("Email already verified", 400);
    }

    if (
      !user.otpCode ||
      !user.otpExpires ||
      user.otpExpires.getTime() < Date.now()
    ) {
      throw new AppError("OTP expired, please request a new one", 400);
    }

    if (user.otpCode !== hashToken(otp)) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    user.isEmailVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await userRepository.save(user);
  }

  async resendOtp(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Always resolve the same way whether or not the email exists or is
    // already verified, so this endpoint can't be used to enumerate accounts.
    if (!user || user.isEmailVerified) return;

    const otp = generateOtp();
    user.otpCode = hashToken(otp);
    user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
    await userRepository.save(user);

    await sendOtpEmail(user.email, otp);
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

    if (!user.isEmailVerified) {
      throw new AppError(
        "Please verify your email with the OTP sent to your inbox before signing in",
        403
      );
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

    const user = await userRepository.findByIdWithRefreshToken(payload.userId);
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

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError("Current password is incorrect", 400);
    }

    user.password = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    // Invalidate any existing session — the user (or whoever guessed the
    // current password) must sign in again with the new credentials.
    user.refreshToken = "";
    await userRepository.save(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Always resolve the same way whether or not the email exists, so this
    // endpoint can't be used to enumerate registered accounts.
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await userRepository.save(user);

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByResetToken(hashToken(token));
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    user.password = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = "";
    await userRepository.save(user);
  }
}

export const authService = new AuthService();
