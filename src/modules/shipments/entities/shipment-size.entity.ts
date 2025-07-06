import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentVariant } from './shioment-variant.entity';

@Entity('tw_embarques_sizes')
export class ShipmentSize {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'n_cantidad_stock', type: 'float' })
  stock: number;

  @ManyToOne(() => ShipmentVariant, (variant: ShipmentVariant) => variant.sizes)
  @JoinColumn({ name: 'id_embarque_variant' })
  variant: ShipmentVariant;

  @ManyToOne(() => Shipment, (shipment: Shipment) => shipment.variants)
  @JoinColumn({ name: 'id_embarque' })
  shipment: Shipment;
}
