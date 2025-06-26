import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Entidad Pivote que define la membresía y el rol base de un
 * Usuario global dentro de un Tenant específico.
 */
@Entity({ name: 'user_tenants' })
@Index(['user', 'tenant', 'role'], { unique: true }) // Asegura que no haya roles duplicados para el mismo usuario y tenant
export class UserTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Relaciones Fundamentales ---

  @ManyToOne(() => User, (user) => user.tenants, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // --- Propiedades de la Membresía ---

  /**
   * Rol base del usuario en este tenant.
   * Ej: 'ADMIN', 'EMPLOYEE', 'CLIENT'
   */
  @Column({ type: 'varchar', length: 50 })
  role: string;

  /**
   * Campo específico para clientes. Indica si el cliente
   * tiene una membresía premium en este tenant.
   */
  @Column({
    name: 'is_premium',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  is_premium: boolean;

  /**
   * Campo específico para clientes. Guarda el ID de la membresía
   * activa del cliente en este tenant.
   */
  @Column({ name: 'membership_id', type: 'varchar', nullable: true })
  membership_id?: string;

  // --- Timestamps Automáticos ---

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
  })
  created_at: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
  })
  updated_at: Date;
}
