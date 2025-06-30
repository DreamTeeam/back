import { Exclude } from 'class-transformer';
import { SubCategory } from 'src/catalogues/subCategory/entities/sub-category.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('tc_category')
export class Category {
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

    @Column('varchar', { //NACHO
  length: 120,
  unique: true,
  })
  slug: string;

  @ManyToMany(() => SubCategory, (subCategory) => subCategory.categories)
  @JoinTable({ name: 'tr_category_sub_category' })
  subcategories: SubCategory[];

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
