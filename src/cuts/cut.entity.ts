import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Employee } from '../modules/users/entities/employee.entity';
import { Audit } from '../audits/audit.entity';

@Entity('tw_cortes')
export class Cut {
  @PrimaryGeneratedColumn('uuid', { name: 'id_corte' })
  id: string;

  @Column({ name: 'd_fecha_corte', type: 'date' })
  date: string;

  @Column({ name: 't_hora_corte', type: 'time' })
  time: string;

  @Column({ name: 'n_cantidad_arqueos', type: 'int' })
  audit_count: number;

  @Column({
    name: 'n_total_arqueos',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_audits: number;

  @Column({ name: 'n_cantidad_ventas', type: 'int' })
  sale_count: number;

  @Column({
    name: 'n_total_ventas_dinero',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_cash_sales: number;

  @Column({ name: 's_descripcion', type: 'varchar', length: 255 })
  description: string;

  @Column({ name: 'n_cantidad_gastos', type: 'int' })
  expense_count: number;

  @Column({
    name: 'n_total_gastos',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  total_expenses: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'id_empleado' })
  employee: Employee;

  @Column({ name: 'id_empleado', type: 'uuid' })
  employee_id: string;

  @OneToMany(() => Audit, (audit) => audit.cut)
  audits: Audit[];

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at?: Date;
}
