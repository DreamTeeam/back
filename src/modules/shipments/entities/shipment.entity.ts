import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ShipmentVariant } from './shipment-variant.entity';

@Entity('tw_embarques')
export class Shipment {
  @PrimaryGeneratedColumn({ name: 'id_embarque' })
  id: number;

  @Column({ name: 's_embarque', type: 'varchar' })
  shipmentCode: string;

  @Column({ name: 'd_fecha_embarque', type: 'date' })
  shipmentDate: Date;

  @Column({ name: 'n_cantidad_productos', type: 'int', default: 0 })
  totalProducts: number;

  @Column({ name: 'n_cantidad_variantes', type: 'int', default: 0 })
  totalVariants: number;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', type: 'timestamp' })
  deletedAt: Date;

  @OneToMany(() => ShipmentVariant, (variant: ShipmentVariant) => variant.shipment)
  variants: ShipmentVariant[];
}