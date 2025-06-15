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

  @Column({ name: 'total_ventas_efectivo', type: 'decimal', precision: 10, scale: 2 })
  totalCashSales: number;

  @Column({ name: 'total_ventas_tarjeta', type: 'decimal', precision: 10, scale: 2 })
  totalCardSales: number;

  @Column({ name: 'total_ventas_transferencia', type: 'decimal', precision: 10, scale: 2 })
  totalTransferSales: number;

  @Column({ name: 'n_cantidad_ventas', type: 'int' })
  saleCount: number;

  @Column({ name: 'n_total_efectivo', type: 'decimal', precision: 10, scale: 2 })
  totalCash: number;

  @Column({ name: 'd_fecha_arqueo', type: 'date' })
  date: string;

  @Column({ name: 't_hora_arqueo', type: 'time' })
  time: string;

  @Column({ name: 's_descripcion', type: 'varchar' })
  description: string;

  @Column({ name: 'id_empleado', type: 'int' })
  employeeId: number;

  @Column({ name: 'id_corte', type: 'int' , nullable: true})
  cutId: number;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
