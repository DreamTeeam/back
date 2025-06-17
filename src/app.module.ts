import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosModule } from './modules/todos/todos.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { UsersModule } from './modules/users/users.module';
import { SubCategoryModule } from './catalogues/subCategory/sub-category.module';
import { CategoryModule } from './catalogues/category/category.module';
import { BrandModule } from './catalogues/brand/brand.module';
import { ProductModule } from './modules/products/product.module';
import { ProductVariantModule } from './modules/productsVariant/product-variant.module';
import { AuditModule } from './modules/auditModification/audit.module';
import { SizeModule } from './modules/sizeProduct/size-product.module';
import { MembershipStatusModule } from './catalogues/MembershipStatus/membership-status.module';
import { Order } from './modules/orders/entities/order.entity';
import { OrdersModule } from './modules/orders/orders.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { MembershipTypesModule } from './modules/subscriptions/membershipTypes/membership-types.module';
import { MembershipsModule } from './modules/subscriptions/membership/memberships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm')!,
    }),
    TodosModule,
    AuthModule,
    RolesModule,
    EmployeesModule,
    UsersModule,
    SubCategoryModule,
    CategoryModule,
    BrandModule,
    ProductModule,
    ProductVariantModule,
    AuditModule,
    SizeModule,
    MembershipStatusModule,
    OrdersModule,
    SubscriptionsModule,
    StripeModule,
    MembershipTypesModule,
    MembershipsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
