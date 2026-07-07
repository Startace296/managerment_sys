import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { AttendanceStatus } from "../types";
import { Employee } from "./Employee";

@Entity("attendances")
@Index(["employee", "workDate"], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, { nullable: false, onDelete: "CASCADE" })
  employee: Employee;

  @Column({ type: "date" })
  workDate: string;

  @Column({ type: "datetime" })
  checkIn: Date;

  @Column({ type: "datetime", nullable: true })
  checkOut: Date | null;

  @Column({ type: "int", nullable: true })
  workedMinutes: number | null;

  @Column({
    type: "enum",
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({ type: "text", nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
