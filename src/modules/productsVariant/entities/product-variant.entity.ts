import { Exclude } from 'class-transformer';
import { Product } from 'src/modules/products/entities/product.entity';
import { Size } from 'src/modules/sizeProduct/entities/size-product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('tw_variant_product')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('float')
  @Column()
  color: string;

  @Column()
  stock: number;

  @Column('uuid')
  size_id: string;

  @Column('uuid')
  product_id: string;

  @ManyToOne(() => Product, (product) => product.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Size, (size) => size.variants)
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @Exclude()
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;
  @Exclude()
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
  @Exclude()
  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deleted_at: Date;
}
