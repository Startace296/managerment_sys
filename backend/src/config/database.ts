import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../entities/User";
import { Department } from "../entities/Department";
import { Employee } from "../entities/Employee";
import { Attendance } from "../entities/Attendance";
import { LeaveRequest } from "../entities/LeaveRequest";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  synchronize: env.NODE_ENV === "development",
  logging: env.NODE_ENV === "development",
  entities: [User, Department, Employee, Attendance, LeaveRequest],
  migrations: [],
});
