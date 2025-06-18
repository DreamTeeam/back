import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('tw_cortes')
export class Cut {
  @PrimaryGeneratedColumn({ name: 'cut_id' })
  id: number;

  @Column({ name: 'd_fecha_corte', type: 'date' })
  date: string;

  @Column({ name: 't_hora_corte', type: 'time' })
  time: string;

  @Column({ name: 'n_cantidad_arqueos', type: 'int' })
  auditCount: number;

  @Column({ name: 'n_total_arqueos', type: 'decimal', precision: 10, scale: 2 })
  totalAudits: number;

  @Column({ name: 'n_cantidad_ventas', type: 'int' })
  saleCount: number;

  @Column({ name: 'n_total_ventas_dinero', type: 'decimal', precision: 10, scale: 2 })
  totalCashSales: number;

  @Column({ name: 's_descripcion', type: 'varchar' })
  description: string;

  @Column({ name: 'id_empleado', type: 'int' })
  employeeId: number;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
