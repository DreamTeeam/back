import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationType } from './types/notification-type.enum';
import { Client } from 'src/modules/users/entities/client.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailerService: MailerService,
  ) {}

  async sendNotification(options: {
    type: NotificationType;
    title: string;
    message: string;
    client?: Client;
    employee?: Employee;
    sendEmail?: boolean;
    emailTemplate?: string;
    emailContext?: Record<string, any>;
  }) {
    const notification = this.notificationRepository.create({
      type: options.type,
      title: options.title,
      message: options.message,
      client: options.client,
      employee: options.employee,
      sent_by_email: !!options.sendEmail,
    });

    await this.notificationRepository.save(notification);

    if (options.sendEmail && options.emailTemplate) {
      const to = options.client?.user?.email || options.employee?.user?.email;
      const name = options.client?.user?.client || options.employee?.user?.client;

      await this.mailerService.sendMail({
        to,
        subject: options.title,
        template: options.emailTemplate,
        context: {
          ...options.emailContext,
          name,
        },
      });
    }

    return notification;
  }

//   async sendPaymentSuccessEmail(order: Order) {
//   if (!order.client || !order.client.user?.email) {
//     this.logger.warn(`No se pudo enviar confirmación de pago: cliente sin email.`);
//     return;
//   }

//   const email = order.client.user.email;
//   const name = order.client.user.client ?? 'Cliente';

//   const products = order.details.map((d) => ({
//     name: d.variant.product.name,
//     variant: d.variant.description,
//     quantity: d.total_amount_of_products,
//     price: d.price,
//   }));

//   await this.mailerService.sendMail({
//     to: email,
//     subject: 'Pago recibido - DreamTeam POS',
//     template: 'payment-success',
//     context: {
//       name,
//       products,
//       total: order.total_order.toFixed(2),
//       date: order.date,
//     },
//   });

//   await this.notificationRepository.save(
//     this.notificationRepository.create({
//       type: 'payment-success',
//       client: order.client,
//       data: {
//         total: order.total_order,
//         orderId: order.id,
//         products,
//         date: order.date,
//       },
//     }),
//   );
// }
}

