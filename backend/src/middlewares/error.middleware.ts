import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  const isDev = env.NODE_ENV === "development";
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};
