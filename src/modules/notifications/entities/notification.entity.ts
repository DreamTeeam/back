// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
//   JoinColumn,
// } from 'typeorm';
// import { Client } from 'src/modules/users/entities/client.entity';
// import { Employee } from 'src/modules/users/entities/employee.entity';
// import { Customer } from 'src/master_data/customer/entities/customer.entity';

// @Entity('tw_notifications')
// export class Notification {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   type: string; // Ej: MEMBERSHIP_EXPIRING

//   @Column()
//   title: string;

//   @Column({ type: 'text' })
//   message: string;

//   @Column({ default: false })
//   read: boolean;

//   @Column({ default: false })
//   sent_by_email: boolean;

//   @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
//   @JoinColumn({ name: 'clientId' }) 
//   client: Client;

//   @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
//   @JoinColumn({ name: 'employeeId' })
//   employee: Employee;

//   @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
//   @JoinColumn({ name: 'customerId' }) 
//   customer: Customer;

//   @CreateDateColumn({ type: 'timestamp' })
//   created_at: Date;
// }
