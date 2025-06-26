import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserTenant } from '../../user-tenants/entities/user-tenant.entity';

/**
 * Entidad de Usuario Global.
 * Representa la identidad única de una persona en toda la plataforma.
 * No contiene información de roles o membresías, solo datos personales.
 */
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  first_name: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  last_name: string;

  @Column({ type: 'varchar', unique: true, nullable: true, name: 'tax_id' })
  tax_id: string;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: true,
    name: 'national_id',
  })
  national_id: string;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: true,
    name: 'phone_number',
  })
  phone_number: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  username: string;

  @Column({ type: 'varchar', select: false }) // 'select: false' es más seguro que @Exclude() para la entidad
  password: string;

  /**
   * ID de Google para la autenticación social.
   */
  @Column({ name: 'google_id', type: 'varchar', nullable: true, select: false })
  google_id: string;

  @OneToMany(() => UserTenant, (userTenant) => userTenant.user)
  tenants: UserTenant[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deleted_at: Date;
}
