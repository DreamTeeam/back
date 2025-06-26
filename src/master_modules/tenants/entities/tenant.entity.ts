// src/tenants/entities/tenant.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
// import { CompanySubscription } from '../../master_data/company_subscription/entities/company-subscription.entity'; // Ajustaremos esta ruta si es necesario

/**
 * Representa a un tenant (cliente/comercio) en el sistema.
 * Cada tenant tiene su propia base de datos y configuración aislada.
 */
@Entity('tenants') // El nombre de la tabla ahora es 'tenants'
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255, nullable: false })
  slug: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'phone_number', length: 50, nullable: true })
  phone_number: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ name: 'db_connection_string', type: 'text', nullable: true })
  db_connection_string: string;

  @Column({ length: 50, default: 'active', nullable: true })
  status: string; // active, inactive, suspended

  // --- Nuevos campos para la gestión de Stripe por Tenant ---

  /**
   * La clave pública de Stripe del tenant. Es segura de exponer.
   */
  @Column({ name: 'stripe_public_key', length: 255, nullable: true })
  stripe_public_key: string;

  /**
   * La clave secreta de Stripe del tenant. NUNCA debe ser expuesta.
   * Se almacena encriptada y se selecciona explícitamente solo cuando es necesario.
   */
  @Column({
    name: 'stripe_secret_key',
    length: 255,
    nullable: true,
    select: false,
  })
  stripe_secret_key: string;

  /**
   * El secreto del webhook de Stripe del tenant para verificar las peticiones de Stripe.
   * NUNCA debe ser expuesto.
   * Se almacena encriptado y se selecciona explícitamente solo cuando es necesario.
   */
  @Column({
    name: 'stripe_webhook_secret',
    length: 255,
    nullable: true,
    select: false,
  })
  stripe_webhook_secret: string;

  // --- Relaciones con Suscripciones ---

  // @OneToOne(() => CompanySubscription)
  // @JoinColumn({ name: 'current_subscription_id' }) // Columna FK para la suscripción activa
  // current_subscription: CompanySubscription;

  // @OneToMany(() => CompanySubscription, (subscription) => subscription.customer)
  // subscriptions: CompanySubscription[]; // Historial de todas las suscripciones

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp without time zone',
    nullable: true,
  })
  deleted_at: Date;
}
