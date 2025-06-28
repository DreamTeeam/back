// import { Injectable } from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Membership } from 'src/modules/subscriptions/membership/entities/membership.entity';
// import { NotificationsService } from './notifications.service';
// import { NotificationType } from './types/notification-type.enum';
// import { VariantSize } from 'src/modules/variantSIzes/entities/variantSizes.entity';
// import { Order } from '../orders/entities/order.entity';

// @Injectable()
// export class NotificationsCronService {
//   constructor(
//     private readonly notificationsService: NotificationsService,
//     @InjectRepository(Membership)
//     private readonly membershipRepo: Repository<Membership>,
//     @InjectRepository(VariantSize)
//     private readonly variantSizeRepo: Repository<VariantSize>,
//     @InjectRepository(Order)
//     private readonly orderRepository: Repository<Order>
//   ) {}

//   @Cron('0 7 * * *')
//   async notifyMembershipExpiring() {
//     const memberships = await this.membershipRepo.createQueryBuilder('membership')
//       .leftJoinAndSelect('membership.client', 'client')
//       .where("membership.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 day'")
//       .getMany();

//     for (const m of memberships) {
//       await this.notificationsService.sendNotification({
//         type: NotificationType.MEMBERSHIP_EXPIRING,
//         title: 'Tu membresía está por vencer',
//         message: `Tu membresía vence el ${m.expiration_date}`,
//         client: m.client,
//         sendEmail: true,
//         emailTemplate: 'membership-expiring',
//         emailContext: { expirationDate: m.expiration_date },
//       });
//     }
//   }

//   @Cron('0 8 * * *')
//   async notifyLowStock() {
//     const variants = await this.variantSizeRepo.createQueryBuilder('vs')
//       .leftJoinAndSelect('vs.variantProduct', 'vp')
//       .leftJoinAndSelect('vp.product', 'p')
//       .leftJoinAndSelect('p.employee', 'employee')
//       .where('vs.stock < 5')
//       .getMany();

//     const grouped = new Map<string, { employee: any, variants: VariantSize[] }>();

//     for (const v of variants) {
//       const emp = v.variantProduct.product.employee;
//       if (!grouped.has(emp.id)) {
//         grouped.set(emp.id, { employee: emp, variants: [] });
//       }
//       grouped.get(emp.id)?.variants.push(v);
//     }

//     for (const { employee, variants } of grouped.values()) {
//       await this.notificationsService.sendNotification({
//         type: NotificationType.PRODUCT_LOW_STOCK,
//         title: 'Productos con stock bajo',
//         message: `Tienes ${variants.length} productos con stock bajo`,
//         employee,
//         sendEmail: true,
//         emailTemplate: 'stock-low',
//         emailContext: {
//           products: variants.map(v => ({
//             name: v.variantProduct.product.name,
//             stock: v.stock,
//           })),
//         },
//       });
//     }
//   }

//   // @Cron('0 6 * * MON')
//   // async sendWeeklySalesSummary() {
//   //   const orders = await this.orderRepository.createQueryBuilder('o')
//   //     .leftJoinAndSelect('o.client', 'client')
//   //     .where("o.date >= CURRENT_DATE - INTERVAL '7 day'")
//   //     .getMany();

//   //   const grouped = new Map<string, { client: Client, total: number }>();

//   //   for (const order of orders) {
//   //     if (!order.client) continue;
//   //     const entry = grouped.get(order.client.id) || { client: order.client, total: 0 };
//   //     entry.total += Number(order.total_order);
//   //     grouped.set(order.client.id, entry);
//   //   }

//   //   for (const { client, total } of grouped.values()) {
//   //     await this.notificationsService.sendNotification({
//   //       type: NotificationType.SALES_SUMMARY,
//   //       title: 'Resumen semanal de ventas',
//   //       message: `Vendiste un total de $${total.toFixed(2)} esta semana.`,
//   //       client,
//   //       sendEmail: true,
//   //       emailTemplate: 'weekly-summary',
//   //       emailContext: { total: total.toFixed(2) },
//   //     });
//   //   }
//   // }
// }
