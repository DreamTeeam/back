import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ShipmentVariant } from './shioment-variant.entity';

@Entity('tw_embarques')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 's_embarque', type: 'varchar' })
  shipment_code: string;

  @Column({ name: 'd_fecha_embarque', type: 'date' })
  shipment_date: Date;

  @Column({ name: 'n_cantidad_productos', type: 'int', default: 0 })
  total_products: number;

  @Column({ name: 'n_cantidad_variantes', type: 'int', default: 0 })
  total_variants: number;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'timestamp' })
  deleted_at: Date;

  @OneToMany(
    () => ShipmentVariant,
    (variant: ShipmentVariant) => variant.shipment,
  )
  variants: ShipmentVariant[];
}
