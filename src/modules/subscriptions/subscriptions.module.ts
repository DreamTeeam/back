import { forwardRef, Module, Scope } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { StripeModule } from '../stripe/stripe.module';
//import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../users/entities/client.entity';
import { TenantTypeOrmModule } from '../../common/typeorm-tenant-repository/tenant-repository.provider';

@Module({
  imports: [
    TenantTypeOrmModule.forFeature([Client]),
    forwardRef(() => StripeModule),
  ],
  providers: [
    {
      provide: SubscriptionsService,
      useClass: SubscriptionsService,
      scope: Scope.REQUEST,
    },
  ],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
