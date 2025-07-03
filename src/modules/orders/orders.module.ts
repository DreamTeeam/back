import { forwardRef, Module, Scope } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StripeModule } from '../stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
//import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetail.entity';
import { ProductModule } from '../products/product.module';
import { CancellationModule } from '../cancellation/cancellation.module';
import { TenantTypeOrmModule } from '../../common/typeorm-tenant-repository/tenant-repository.provider';
// import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => StripeModule),
    TenantTypeOrmModule.forFeature([Order, OrderDetail]),
    SubscriptionsModule,
    CancellationModule,
    // forwardRef(() => NotificationsModule),
    forwardRef(() => ProductModule),
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrdersService,
      useClass: OrdersService,
      scope: Scope.REQUEST, // <-- ¡CAMBIO CRÍTICO AQUÍ!
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
