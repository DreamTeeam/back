// import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';
// import { CronJob } from 'cron';
// import { SchedulerRegistry } from '@nestjs/schedule';
// import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';
// import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
// import { DataSource, Repository } from 'typeorm';
// import { Membership } from 'src/modules/subscriptions/membership/entities/membership.entity';
// import { NotificationsService } from './notifications.service';
// import { NotificationType } from './types/notification-type.enum';
// import { VariantSize } from 'src/modules/variantSIzes/entities/variantSizes.entity';
// import { Order } from '../orders/entities/order.entity';
// import { CompanySubscription } from 'src/master_data/company_subscription/entities/company-subscription.entity';
// import { Employee } from '../users/entities/employee.entity';
// import { TenantConnectionService } from 'src/common/tenant-connection/tenant-connection.service';
// import { ChatGateway } from '../websocket-chat/chat.gateway';  // NACHO

// @Injectable()
// export class NotificationsCronService implements OnModuleInit {
//   private readonly logger = new Logger(NotificationsCronService.name);
//   constructor(
//     @InjectDataSource('masterConnection')
//     private readonly masterDataSource: DataSource,
//     private readonly dataSource: DataSource,
//     private readonly schedulerRegistry: SchedulerRegistry,
//     private readonly notificationsService: NotificationsService,
//     private readonly tenantConnectionService: TenantConnectionService,
//     @InjectTenantRepository(Membership)
//     private readonly membershipRepo: Repository<Membership>,
//     @InjectTenantRepository(VariantSize)
//     private readonly variantSizeRepo: Repository<VariantSize>,
//     @InjectTenantRepository(Order)
//     private readonly orderRepository: Repository<Order>,
//     private readonly chatGateway: ChatGateway, // NACHO
//   ) {}

//   onModuleInit() {
//     const job1 = new CronJob('0 7 * * *', () =>
//       this.notifyMembershipExpiring(),
//     );
//     this.schedulerRegistry.addCronJob('notifyMembershipExpiring', job1);
//     job1.start();

//     const job2 = new CronJob('0 8 * * *', () => this.notifyLowStock());
//     this.schedulerRegistry.addCronJob('notifyLowStock', job2);
//     job2.start();

//     const job3 = new CronJob('0 6 * * MON', () =>
//       this.sendWeeklySalesSummary(),
//     );
//     this.schedulerRegistry.addCronJob('sendWeeklySalesSummary', job3);
//     job3.start();

//     const job4 = new CronJob('0 9 * * *', () =>
//       this.notifyCompanySubscriptionsExpiring(),
//     );
//     this.schedulerRegistry.addCronJob(
//       'notifyCompanySubscriptionsExpiring',
//       job4,
//     );
//     job4.start();

//     this.logger.log('Crons registrados manualmente');
//   }

//   async notifyMembershipExpiring() {
//     try {
//       const memberships = await this.membershipRepo
//         .createQueryBuilder('membership')
//         .leftJoinAndSelect('membership.client', 'client')
//         .leftJoinAndSelect('client.user', 'user')
//         .where(
//           "membership.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 day'",
//         )
//         .getMany();

//       for (const m of memberships) {
//         try {
//           await this.notificationsService.sendNotification({
//             type: NotificationType.MEMBERSHIP_EXPIRING,
//             title: 'Tu membresía está por vencer',
//             message: `Tu membresía vence el ${m.expiration_date}`,
//             client: m.client,
//             sendEmail: true,
//             emailTemplate: 'membership-expiring',
//             emailContext: {
//               expirationDate: new Date(m.expiration_date).toLocaleDateString(
//                 'es-CO',
//               ),
//             },
//           });
//           this.logger.log(`Notificada expiración a ${m.client?.user?.email}`);
//         } catch (error) {
//           this.logger.error(
//             `Error enviando notificación a ${m.client?.user?.email}`,
//             error,
//           );
//         }
//       }
//     } catch (error) {
//       this.logger.error('Error general en notifyMembershipExpiring', error);
//     }
//   }

//   async notifyLowStock() {
//     this.logger.log('Ejecutando tarea cron para notificar stock bajo...');
//     try {
//       const variants = await this.variantSizeRepo
//         .createQueryBuilder('vs')
//         .leftJoinAndSelect('vs.variantProduct', 'vp')
//         .leftJoinAndSelect('vp.product', 'p')
//         .leftJoinAndSelect('p.employee', 'e')
//         .leftJoinAndSelect('e.user', 'user')
//         .where('vs.stock < 5')
//         .getMany();

//       await this.notificationsService.notifyLowStockMultiple(variants);
//       this.logger.log(
//         `Notificaciones de bajo stock enviadas (${variants.length})`,
//       );
//       if (variants.length > 0) {
//       this.chatGateway.server.emit('low_stock_notification', {
//         title: 'Alerta de Stock Bajo',
//         message: `Hay ${variants.length} productos con bajo stock.`,
//         count: variants.length,
//       });
//       this.logger.log('Notificación PUSH de bajo stock enviada a los clientes.');
//     }
    
//     } catch (error) {
//       this.logger.error('Error en notifyLowStock', error);
//     }
//   }

//   async sendWeeklySalesSummary() {
//     try {
//       const orders = await this.orderRepository
//         .createQueryBuilder('o')
//         .leftJoinAndSelect('o.client', 'client')
//         .leftJoinAndSelect('client.user', 'user')
//         .where("o.date >= CURRENT_DATE - INTERVAL '7 day'")
//         .getMany();

//       const total = orders.reduce(
//         (acc, order) => acc + Number(order.total_order),
//         0,
//       );

//       const admins = await this.notificationsService.getAdmins();

//       for (const admin of admins) {
//         const email = admin.user?.email;
//         if (!email) continue;

//         try {
//           await this.notificationsService.sendNotification({
//             type: NotificationType.SALES_SUMMARY,
//             title: 'Resumen semanal de ventas',
//             message: `Vendiste un total de $${total.toFixed(2)} esta semana.`,
//             sendEmail: true,
//             emailTemplate: 'weekly-summary',
//             emailContext: { total: total.toFixed(2) },
//             employee: admin,
//           });

//           this.logger.log(`Resumen enviado a ${email}`);
//         } catch (error) {
//           this.logger.error(`Error enviando resumen a ${email}`, error);
//         }
//       }
//     } catch (error) {
//       this.logger.error('Error general en sendWeeklySalesSummary', error);
//     }
//   }

//   async notifyCompanySubscriptionsExpiring() {
//     try {
//       // 1. Consultamos las suscripciones activas que vencen en los próximos 3 días desde la BD maestra
//       const companySubscriptionRepo =
//         this.masterDataSource.getRepository(CompanySubscription);

//       const subscriptions = await companySubscriptionRepo
//         .createQueryBuilder('sub')
//         .leftJoinAndSelect('sub.customer', 'customer')
//         .where("sub.status = 'active'")
//         .andWhere(
//           "sub.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 day'",
//         )
//         .getMany();

//       this.logger.log(
//         `Se encontraron ${subscriptions.length} suscripciones próximas a expirar`,
//       );

//       for (const sub of subscriptions) {
//         const customer = sub.customer;

//         try {
//           // 2. Obtener conexión al tenant (por ID del customer)
//           const tenantDataSource =
//             await this.tenantConnectionService.getTenantDataSource(customer.id);
//           const employeeRepo = tenantDataSource.getRepository(Employee);

//           // 3. Buscar el empleado con rol admin activo
//           const admin = await employeeRepo
//             .createQueryBuilder('employee')
//             .leftJoinAndSelect('employee.user', 'user')
//             .leftJoin('employee.roles', 'role')
//             .where('UPPER(role.name) = :roleName', { roleName: 'ADMIN' })
//             .getOne();

//           // 4. Enviar notificación al admin
//           if (admin) {
//             this.logger.log(
//               `Admin encontrado para ${customer.slug}: ${admin.user?.email}`,
//             );
//             await this.notificationsService.sendNotification({
//               type: NotificationType.COMPANY_SUBSCRIPTION_EXPIRING,
//               title: 'Tu suscripción empresarial está por vencer',
//               message: `La suscripción de tu empresa vence el ${sub.end_date}`,
//               employee: admin,
//               sendEmail: true,
//               emailTemplate: 'company-subscription-expiring',
//               emailContext: {
//                 expirationDate: new Date(sub.end_date).toLocaleDateString(
//                   'es-CO',
//                 ),
//                 companyName: customer.name,
//               },
//             });

//             this.logger.log(
//               `Notificada expiración a admin ${admin.user?.email} del tenant ${customer.slug}`,
//             );
//           }
//         } catch (error) {
//           this.logger.error(
//             `Error notificando a empresa ${customer.slug} (${customer.id}): ${error.message}`,
//             error,
//           );
//         }
//       }
//     } catch (error) {
//       this.logger.error(
//         'Error general en notifyCompanySubscriptionsExpiring',
//         error,
//       );
//     }
//   }

// }
