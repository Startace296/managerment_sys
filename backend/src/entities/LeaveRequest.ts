import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { LeaveType, LeaveStatus } from "../types";
import { Employee } from "./Employee";
import { User } from "./User";

@Entity("leave_requests")
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, { nullable: false, onDelete: "CASCADE" })
  employee: Employee;

  @Column({ type: "enum", enum: LeaveType })
  leaveType: LeaveType;

  @Column({ type: "date" })
  startDate: string;

  @Column({ type: "date" })
  endDate: string;

  @Column({ type: "text" })
  reason: string;

  @Column({
    type: "enum",
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  reviewedBy: User | null;

  @Column({ type: "text", nullable: true })
  reviewNote: string | null;

  @Column({ type: "datetime", nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
