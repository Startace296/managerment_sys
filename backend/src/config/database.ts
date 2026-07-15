import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../entities/User";
import { Department } from "../entities/Department";
import { Employee } from "../entities/Employee";
import { Attendance } from "../entities/Attendance";
import { LeaveRequest } from "../entities/LeaveRequest";
import { Payroll } from "../entities/Payroll";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  synchronize: env.NODE_ENV === "development",
  logging: env.NODE_ENV === "development",
  entities: [User, Department, Employee, Attendance, LeaveRequest, Payroll],
  migrations: [],
});

let connectionPromise: Promise<DataSource> | null = null;

// Serverless functions can receive concurrent requests on a cold start,
// so the first requests share a single in-flight initialize() call instead
// of each opening their own connection.
export const ensureDatabaseConnection = (): Promise<DataSource> => {
  if (AppDataSource.isInitialized) {
    return Promise.resolve(AppDataSource);
  }
  if (!connectionPromise) {
    connectionPromise = AppDataSource.initialize().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
};
