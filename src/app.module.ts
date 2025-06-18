import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosModule } from './modules/todos/todos.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { Product } from './modules/temp-entities/product.placeholder.entity'; 
import { TypeOfPayment } from './modules/temp-entities/type-of-payment.placeholder.entity'; 
import { MembershipsModule } from './modules/subscriptions/membership/memberships.module';
import { MembershipTypesModule } from './modules/subscriptions/membershipTypes/membership-types.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { MembershipStatusModule } from './catalogues/MembershipStatus/membership-status.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { UsersModule } from './modules/users/users.module';
import { SubCategoryModule } from './catalogues/subCategory/sub-category.module';
import { CategoryModule } from './catalogues/category/category.module';
import { BrandModule } from './catalogues/brand/brand.module';
import { ProductModule } from './modules/products/product.module';
import { ProductVariantModule } from './modules/productsVariant/product-variant.module';
import { SizeModule } from './modules/sizeProduct/size-product.module';
import { Client } from './modules/users/entities/client.entity';
import { AuditModule } from './audits/audit.module';
import { CutModule } from './cuts/cut.module';
import { Employee } from './modules/users/entities/employee.entity';

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

    TypeOrmModule.forFeature([Client, Employee, Product, TypeOfPayment]),

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
    CutModule,
    CheckoutModule,
  ],
  providers: [], 
})
export class AppModule {}




