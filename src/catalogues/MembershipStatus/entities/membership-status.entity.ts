import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tc_membership_status')
export class MembershipStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', {
    length: 100,
  })
  membershipStatus: string;

  @Column({ default: true })
  isActive: boolean;
}