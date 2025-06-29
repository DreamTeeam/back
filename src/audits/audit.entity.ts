import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cut } from 'src/cuts/cut.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';

@Entity('tw_arqueos')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'total_ventas_efectivo',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_ventas_efectivo: number;

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
  total_ventas_tarjeta: number;

  @Column({ name: 'n_cantidad_ventas', type: 'int' })
  n_cantidad_ventas: number;

  @Column({
    name: 'n_total_efectivo',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  n_total_efectivo: number;

  @Column({ name: 's_descripcion', type: 'varchar', length: 255 })
  s_descripcion: string;

  @Column({ name: 'd_fecha_arqueo', type: 'date' })
  d_fecha_arqueo: string;

  @Column({ name: 't_hora_arqueo', type: 'time' })
  t_hora_arqueo: string;

  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'id_empleado' })
  employee: Employee;

  @ManyToOne(() => Cut, (cut) => cut.audits, { nullable: true })
  @JoinColumn({ name: 'id_corte' })
  cut: Cut;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deleted_at?: Date;
}
