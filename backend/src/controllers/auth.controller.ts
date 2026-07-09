import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../types";

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, user, "User registered successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, tokens } = await authService.login(req.body);
      sendSuccess(res, { user, tokens }, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, "Token refreshed");
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      sendSuccess(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, req.user, "Current user info");
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(
        req.user!.userId,
        currentPassword,
        newPassword
      );
      sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(
        res,
        null,
        "If an account exists for this email, a reset link has been sent"
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      sendSuccess(res, null, "Password reset successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
