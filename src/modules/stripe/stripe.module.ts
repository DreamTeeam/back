import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StripeController } from './stripe.controller';
import { CompanySubscriptionModule } from 'src/master_data/company_subscription/company-subscription.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => CompanySubscriptionModule),
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
