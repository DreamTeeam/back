// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Notification } from './entities/notification.entity';
// import { NotificationsService } from './notifications.service';
// // import { NotificationsCronService } from './notifications-cron.service';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { join } from 'path';
// import { Membership } from '../subscriptions/membership/entities/membership.entity';
// import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';
// import { Order } from '../orders/entities/order.entity';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Notification, Membership, VariantSize, Order]),
//     MailerModule.forRoot({
//       transport: {
//         service: 'gmail',
//         auth: {
//           user: 'dreamteeam20@gmail.com',
//           pass: 'TU_APP_PASSWORD',
//         },
//       },
//       defaults: {
//         from: '"Tu App POS" <dreamteeam20@gmail.com>',
//       },
//       template: {
//         dir: join(__dirname, 'mailer/templates'),
//         adapter: new HandlebarsAdapter(),
//         options: { strict: true },
//       },
//     }),
//   ],
//   // providers: [NotificationsService, NotificationsCronService],
//   exports: [NotificationsService],
// })
// export class NotificationsModule {}