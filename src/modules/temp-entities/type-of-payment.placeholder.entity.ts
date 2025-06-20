import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

@Entity('tw_formas_pago') 
export class TypeOfPayment {
  @PrimaryGeneratedColumn({ name: 'id_type_of_payment' })
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Order, (order) => order.typeOfPayment)
  orders: Order[];
}
