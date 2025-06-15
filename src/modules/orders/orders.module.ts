import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StripeModule } from '../stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetail.entity';

@Module({
  imports: [
    forwardRef(() => StripeModule),
    TypeOrmModule.forFeature([Order, OrderDetail]),
    SubscriptionsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
