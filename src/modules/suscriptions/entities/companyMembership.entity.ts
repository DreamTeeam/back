import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Membership } from './membership.entity';

@Entity({ name: 'tw_company_membership' })
export class CompanyMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Membership)
  @JoinColumn({ name: 'tw_membership_relation' })
  membresia: Membership;
}
