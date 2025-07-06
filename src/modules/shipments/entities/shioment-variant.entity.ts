import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentSize } from './shipment-size.entity';

@Entity('tw_embarques_variants')
export class ShipmentVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'n_cantidad_talles', type: 'int', default: 0 })
  total_sizes: number;

  @ManyToOne(() => Shipment, (shipment: Shipment) => shipment.variants)
  @JoinColumn({ name: 'id_embarque' })
  shipment: Shipment;

  @OneToMany(() => ShipmentSize, (size: ShipmentSize) => size.variant)
  sizes: ShipmentSize[];
}
