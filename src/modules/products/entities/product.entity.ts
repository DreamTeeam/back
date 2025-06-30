import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from 'src/catalogues/category/entities/category.entity';
import { SubCategory } from 'src/catalogues/subCategory/entities/sub-category.entity';
import { Brand } from 'src/catalogues/brand/entities/brand.entity';
import { ProductVariant } from 'src/modules/productsVariant/entities/product-variant.entity';
import { Exclude } from 'class-transformer';
import { User } from 'src/modules/users/entities/user.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';

@Entity('tw_products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', {
    length: 300,
  })
  name: string;

  @Column('text')
  description: string;

  @Column('varchar', {
    length: 200,
    unique: true,
  })
  code: string;

  @Column('decimal', { precision: 10, scale: 2 })
  purchase_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sale_price: number;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'uuid' })
  sub_category_id: string;

  @Column({ type: 'uuid' })
  brand_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

    // NACHO
  @Column('varchar', { length: 200, unique: true })
  slug: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => SubCategory)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

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
