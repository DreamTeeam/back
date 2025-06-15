import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from 'src/modules/productsVariant/entities/product-variant.entity';

@Entity('tw_order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number;

  @Column({ type: 'int' })
  total_amount_of_products: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  subtotal_order: number;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Order, (order) => order.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tw_order_relation' })
  order: Order;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'tw_product_variant_relation' })
  variant: ProductVariant;
}
