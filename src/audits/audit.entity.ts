import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('tw_arqueos')
export class Audit {
  @PrimaryGeneratedColumn({ name: 'id_arqueo' })
  id: number;

  @Column({
    name: 'total_c_efectivo',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_cash_sales: number;

  @Column({
    name: 'total_ventas_tarjeta',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_card_sales: number;

  @Column({
    name: 'total_ventas_transferencia',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_transfer_sales: number;

  @Column({ name: 'n_cantidad_ventas', type: 'int' })
  sale_count: number;

  @Column({
    name: 'n_total_efectivo',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_cash: number;

  @Column({ name: 'd_fecha_arqueo', type: 'date' })
  date: string;

  @Column({ name: 't_hora_arqueo', type: 'time' })
  time: string;

  @Column({ name: 's_descripcion', type: 'varchar' })
  description: string;

  @Column({ name: 'id_empleado', type: 'int' })
  employee_id: number;

  @Column({ name: 'id_corte', type: 'int' })
  cut_id: number;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at?: Date;
}
