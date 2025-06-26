import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MembershipType } from '../../membershipTypes/entities/membershipType.entity';
import { Client } from 'src/modules/users/entities/client.entity';
import { MembershipStatus } from 'src/catalogues/MembershipStatus/entities/membership-status.entity';

@Entity({ name: 'tw_membership' })
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  creation_date: string;

  @Column({ type: 'date' })
  expiration_date: string;

  @Column({ type: 'varchar', unique: true })
  stripe_subscription_id: string;

  @Column({ type: 'varchar' })
  stripe_customer_id: string;

  @ManyToOne(() => MembershipType)
  @JoinColumn({ name: 'tc_membership_type_id' })
  type: MembershipType;

  @ManyToOne(() => MembershipStatus)
  @JoinColumn({ name: 'tc_membership_status_id' })
  status: MembershipStatus;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'tw_clients_id' })
  client: Client;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
