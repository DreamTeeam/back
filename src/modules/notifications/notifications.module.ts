// import { Module, forwardRef } from '@nestjs/common';
// import { OrdersModule } from '../orders/orders.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Notification } from './entities/notification.entity';
// import { NotificationsService } from './notifications.service';
// import { NotificationsCronService } from './notifications-cron.service';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { join } from 'path';
// import { Membership } from '../subscriptions/membership/entities/membership.entity';
// import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';
// import { Order } from '../orders/entities/order.entity';
// import { NotificationsTestController } from './notifications.controller';
// import { MailerService } from './mailer/mailer.service';
// import { CompanySubscription } from 'src/master_data/company_subscription/entities/company-subscription.entity';
// import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';
// import { ChatModule } from '../websocket-chat/chat.module';

// @Module({
//   imports: [
//     forwardRef(() => OrdersModule),
//     ChatModule,
//     TenantTypeOrmModule.forFeature([
//       Notification,
//       Membership,
//       VariantSize,
//       Order,
//       CompanySubscription,
//     ]),
//     TypeOrmModule.forFeature([CompanySubscription], 'masterConnection'),
//     MailerModule.forRoot({
//       transport: {
//         service: 'gmail',
//         auth: {
//           user: process.env.MAIL_NOTI_USER,
//           pass: process.env.MAIL_NOTI_PASS,
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
//   providers: [NotificationsService, NotificationsCronService, MailerService],
//   exports: [NotificationsService, MailerService, TenantTypeOrmModule],
//   controllers: [NotificationsTestController],
// })
// export class NotificationsModule {}
