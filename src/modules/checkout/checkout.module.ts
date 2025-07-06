import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { TenantTypeOrmModule } from '../../common/typeorm-tenant-repository/tenant-repository.provider';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderDetail } from '../../modules/orders/entities/orderDetail.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TenantTypeOrmModule.forFeature([Order, OrderDetail, Product])],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
