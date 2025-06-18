import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductVariant } from 'src/modules/productsVariant/entities/product-variant.entity';
import { Exclude } from 'class-transformer';

@Entity('tw_sizes')
export class Size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  size_us: number;

  @Column('float')
  size_eur: number;

  @Column('float')
  size_cm: number;

  @OneToMany(() => ProductVariant, (variant) => variant.size)
  variants: ProductVariant[];

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
