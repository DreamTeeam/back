import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { Membership } from '../../membership/entities/membership.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';

@Entity({ name: 'tw_company_membership' })
export class CompanyMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Membership)
  @JoinColumn({ name: 'tw_membership_relation' })
  membresia: Membership;

  @OneToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
