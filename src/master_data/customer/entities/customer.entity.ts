import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { CompanySubscription } from '../../company_subscription/entities/company-subscription.entity'; // Asegúrate de que esta ruta sea correcta

@Entity('customers') // Nombre de la tabla en la DB maestra
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'phone_number', length: 50, nullable: true }) // Usa snake_case para la columna en la DB
  phone_number: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'db_connection_string', type: 'text' })
  db_connection_string: string;

  @Column({ length: 50, default: 'active' })
  status: string; // active, inactive, suspended

  @Column({ name: 'current_membership_id', type: 'uuid', nullable: true })
  current_membership_id: string;

  @OneToOne(() => CompanySubscription, (subscription) => subscription.customer)
  @JoinColumn({ name: 'current_membershipid' })
  current_membershipid: CompanySubscription;

  @OneToMany(() => CompanySubscription, (subscription) => subscription.customer)
  subscriptions: CompanySubscription[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'NOW()',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp without time zone',
    nullable: true,
  })
  deletedAt: Date;
}
