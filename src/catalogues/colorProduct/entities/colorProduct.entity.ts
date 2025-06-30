import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ProductVariant } from '../../../modules/productsVariant/entities/product-variant.entity';
import { Exclude } from 'class-transformer';

@Entity('tc_color')
export class Color {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  color: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  hexCode: string;

  @OneToMany(() => ProductVariant, (variant) => variant.color)
  productVariants: ProductVariant[];

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
