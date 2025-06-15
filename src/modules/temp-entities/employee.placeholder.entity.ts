import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
@Entity('id_empleados')
export class Employee {
  @PrimaryGeneratedColumn({ name: 'id_employee' })
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Order, (order) => order.employee)
  orders: Order[];
}

