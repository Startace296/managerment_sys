import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { PayrollStatus } from "../types";
import { Employee } from "./Employee";

@Entity("payrolls")
@Index(["employee", "year", "month"], { unique: true })
export class Payroll {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, { nullable: false, onDelete: "CASCADE" })
  employee: Employee;

  @Column({ type: "int" })
  month: number;

  @Column({ type: "int" })
  year: number;

  // Snapshot of Employee.salary at calculation time, so a later raise doesn't
  // change the amount on an already-generated payslip.
  @Column({ type: "decimal", precision: 15, scale: 2 })
  baseSalary: number;

  @Column({ type: "int" })
  standardWorkDays: number;

  @Column({ type: "int" })
  actualWorkDays: number;

  @Column({ type: "int", default: 0 })
  paidLeaveDays: number;

  @Column({ type: "int", default: 0 })
  unpaidLeaveDays: number;

  @Column({ type: "int", default: 0 })
  overtimeMinutes: number;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  netSalary: number;

  @Column({
    type: "enum",
    enum: PayrollStatus,
    default: PayrollStatus.DRAFT,
  })
  status: PayrollStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
