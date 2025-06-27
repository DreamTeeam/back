import { Exclude } from 'class-transformer';
import { Brand } from 'src/catalogues/brand/entities/brand.entity';
import { Category } from 'src/catalogues/category/entities/category.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  DeleteDateColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('tc_sub_category')
export class SubCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', {
    length: 100,
  })
  name: string;

  @Column('varchar', {
    length: 100,
  })
  key: string;

  @Column('text', {
    default: 'No image',
  })
  image: string;

    //NACHO
  @Column('varchar', {
    length: 120,
    unique: true,
  })
  slug: string;

  @ManyToMany(() => Category, (category) => category.subcategories)
  categories: Category[];

  @ManyToMany(() => Brand, (brand) => brand.subcategories)
  brands: Brand[];

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
