import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';
import { OrderDetail } from 'src/modules/orders/entities/orderDetail.entity';
import { Product } from 'src/modules/temp-entities/product.placeholder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderDetail, Product])],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
