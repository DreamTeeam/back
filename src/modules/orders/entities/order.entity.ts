import { Client } from 'src/modules/users/entities/client.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { OrderDetail } from './orderDetail.entity';
import { Audit } from 'src/audits/audit.entity';
import { TypeOfPayment } from 'src/modules/type-of-payment/type-of-payment.entity';

@Entity({ name: 'tw_orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column({ type: 'varchar' })
  // folio: string;

  @Column({ type: 'int' })
  total_products: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_order: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true })
  details: OrderDetail[];

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'tw_clients_relation' })
  client: Client | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'tw_employee_relation' })
  employee: Employee;

  @ManyToOne(() => Audit, { nullable: true })
  @JoinColumn({ name: 'audit_id' })
  audit?: Audit;

  @ManyToOne(() => TypeOfPayment)
@JoinColumn({ name: 'type_of_payment_id' })
type_of_payment: TypeOfPayment;

  //nombre de cashReconciliations ok ??

  // @ManyToOne(() => CashReconciliations, { nullable: true })
  // @JoinColumn({ name: 'cash_reconciliations_relation' })
  // cashReconciliations: CashReconciliations;

  //   @ManyToOne(() => PaymentMethod)
  //   @JoinColumn({ name: 'payment_method_relation' })
  //   paymentMethod: PaymentMethod;
}
