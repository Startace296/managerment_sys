import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";
import { UserRole } from "../types";
import { Employee } from "./Employee";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Column({ nullable: true, length: 500, select: false })
  refreshToken: string;

  @Column({ type: "varchar", nullable: true, length: 255, select: false })
  resetPasswordToken: string | null;

  @Column({ type: "datetime", nullable: true, select: false })
  resetPasswordExpires: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: "varchar", nullable: true, length: 255, select: false })
  otpCode: string | null;

  @Column({ type: "datetime", nullable: true, select: false })
  otpExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Employee, (employee) => employee.user)
  employee: Employee;
}
