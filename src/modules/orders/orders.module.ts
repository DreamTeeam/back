import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StripeModule } from '../stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetail.entity';
import { ProductModule } from '../products/product.module';
import { Audit } from 'src/audits/audit.entity';
import { Employee } from '../users/entities/employee.entity';
import { TypeOfPayment } from '../type-of-payment/type-of-payment.entity';
import { Client } from '../users/entities/client.entity';

@Module({
  imports: [
    forwardRef(() => StripeModule),
    TypeOrmModule.forFeature([Order, OrderDetail, TypeOfPayment]),
    SubscriptionsModule,
    ProductModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
