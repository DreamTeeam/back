import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('id_products') // nombre real de la tabla en DB
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;
}
