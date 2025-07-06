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
import { Cancellation } from 'src/modules/cancellation/entities/cancellation.entity';
import { PaymentMethod } from '../payment-method.enum';

export enum OrderStatus {
  COMPLETED = 'Completada',
  CANCELLED = 'Cancelada',
}

@Entity({ name: 'tw_orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unique: true, generated: 'increment' })
  folio: string;

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
  @JoinColumn({ name: 'tw_client_id' })
  client: Client | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'tw_employee_id' })
  employee: Employee;

  @ManyToOne(() => Audit, { nullable: true })
  @JoinColumn({ name: 'audit_id' })
  audit?: Audit;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  payment_method: PaymentMethod;

  @OneToOne(() => Cancellation, (cancellation) => cancellation.order, {
    nullable: true,
    cascade: true,
  })
  cancellation?: Cancellation;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.COMPLETED,
  })
  status: OrderStatus;
}









// import { Client } from 'src/modules/users/entities/client.entity';
// import { Employee } from 'src/modules/users/entities/employee.entity';
// import {
//   Column,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   OneToMany,
//   OneToOne,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
//   DeleteDateColumn,
// } from 'typeorm';
// import { OrderDetail } from './orderDetail.entity';
// import { Audit } from 'src/audits/audit.entity';
// import { TypeOfPayment } from 'src/modules/type-of-payment/type-of-payment.entity';
// import { Cancellation } from 'src/modules/cancellation/entities/cancellation.entity';

// @Entity({ name: 'tw_orders' })
// export class Order {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'int', unique: true, generated: 'increment' })
//   folio: string;

//   @Column({ type: 'int' })
//   total_products: number;

//   @Column({ type: 'decimal', precision: 10, scale: 2 })
//   total_order: number;

//   @Column({ type: 'date' })
//   date: string;

//   @Column({ type: 'time' })
//   time: string;

//   @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
//   updated_at: Date;

//   @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true })
//   details: OrderDetail[];

//   @ManyToOne(() => Client, { nullable: true })
//   @JoinColumn({ name: 'tw_client_id' })
//   client: Client | null;

//   @ManyToOne(() => Employee)
//   @JoinColumn({ name: 'tw_employee_id' })
//   employee: Employee;

//   @ManyToOne(() => Audit, { nullable: true })
//   @JoinColumn({ name: 'audit_id' })
//   audit?: Audit;

//   @ManyToOne(() => TypeOfPayment)
//   @JoinColumn({ name: 'type_of_payment_id' }) //comente esto de flor
//   type_of_payment: TypeOfPayment;

//   @OneToOne(() => Cancellation, (cancellation) => cancellation.order, {
//     nullable: true,
//     cascade: true,
//   })
//   cancellation?: Cancellation;

//   //descomente esto
//   // @ManyToOne(() => PaymentMethod)
//   // @JoinColumn({ name: 'payment_method_relation' })
//   // paymentMethod: PaymentMethod;
// }
