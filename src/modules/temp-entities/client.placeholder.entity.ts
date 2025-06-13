import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order} from '../orders/entities/order.entity'
@Entity('id_clients')
export class Client {
  @PrimaryGeneratedColumn()
  id_client: number;

  @Column()
  name: string;

    @Column() 
  email: string;

  @OneToMany(() => Order, (order) => order.client)
  orders: Order[];
}
