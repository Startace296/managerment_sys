import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { EmployeeStatus } from "../types";
import { User } from "./User";
import { Department } from "./Department";

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  employeeCode: string;

  @Column({ type: "date" })
  dateOfBirth: Date;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  salary: number;

  @Column({ length: 100 })
  position: string;

  @Column({ type: "date" })
  hireDate: Date;

  @Column({
    type: "enum",
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.employee)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
    onDelete: "SET NULL",
  })
  department: Department;
}
