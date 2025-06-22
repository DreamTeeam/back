import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { GlobalMembershipType } from '../../global_membership_type/entities/global-membership-type.entity';

@Entity('company_subscriptions')
export class CompanySubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customer_id: string; 

  @ManyToOne(() => Customer, (customer) => customer.subscriptions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'uuid' })
  membership_type_id: string; 

  @ManyToOne(() => GlobalMembershipType)
  @JoinColumn({ name: 'membership_typeid' })
  membership_typeid: GlobalMembershipType;

  @Column({ length: 255, unique: true })
  stripe_subscription_id: string;

  @Column({ length: 255 })
  stripe_customer_id: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ length: 50 })
  status: string; // active, cancelled, expired

  @Column({ length: 50 })
  payment_status: string; // paid, unpaid, past_due

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'NOW()',
  })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
  deletedAt: Date;
}
