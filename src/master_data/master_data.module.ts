import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//? Entidades y módulos de componentes de datos maestros
import { Customer } from './customer/entities/customer.entity';
import { CustomerModule } from './customer/customer.module';

import { CompanySubscription } from './company_subscription/entities/company-subscription.entity';
import { CompanySubscriptionModule } from './company_subscription/company-subscription.module';

import { GlobalMembershipType } from './global_membership_type/entities/global-membership-type.entity';
import { GlobalMembershipTypeModule } from './global_membership_type/global-membership-type.module';

@Module({
  imports: [
    //? Módulos específicos de datos maestros
    CustomerModule,
    CompanySubscriptionModule,
    GlobalMembershipTypeModule,
  ],
  //? Para usar en otros lugares (servicio de autenticación global)
  exports: [
    CustomerModule,
    CompanySubscriptionModule,
    GlobalMembershipTypeModule,
  ],
})
export class MasterDataModule {}
