import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySubscriptionService } from './company-subscription.service';
import { CompanySubscriptionController } from './company-subscription.controller';
import { CompanySubscription } from './entities/company-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanySubscription], 'masterConnection'),
  ], //! Especificar la conexión
  providers: [CompanySubscriptionService],
  controllers: [CompanySubscriptionController],
  exports: [CompanySubscriptionService],
})
export class CompanySubscriptionModule {}
