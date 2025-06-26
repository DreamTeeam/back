import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeormConfig, { masterDbConfig } from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeormConfigAlias, { tenantDbConfigTemplate } from './config/typeorm';
import { JwtModule } from '@nestjs/jwt';

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
import { AuditModule } from './audits/audit.module';
import { MembershipStatusModule } from './catalogues/MembershipStatus/membership-status.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { MembershipTypesModule } from './modules/subscriptions/membershipTypes/membership-types.module';
import { MembershipsModule } from './modules/subscriptions/membership/memberships.module';
import { CutModule } from './cuts/cut.module';
import { SizeModule } from './catalogues/sizeProduct/size-product.module';
import { Size } from './catalogues/sizeProduct/entities/size-product.entity';
import { ColorModule } from './catalogues/colorProduct/colorProduct.module';
import { VariantSizesModule } from './modules/variantSIzes/variant-sizes.module';
import { MasterDataModule } from './master_data/master_data.module';
import { CancellationReasonModule } from './catalogues/cancellationReason/cancellation-reason.module';
import { TenantConnectionModule } from './common/tenant-connection/tenant-connection.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { User } from './modules/users/entities/user.entity';
import { CancellationModule } from './modules/cancellation/cancellation.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { ChatModule } from './modules/websocket-chat/chat.module';
import { ChatGateway } from './modules/websocket-chat/chat.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfigAlias],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm')!,
    }),
    TypeOrmModule.forRoot(masterDbConfig),

    //TODO DESCOMENTAR PARA SINCRONIZAR TENANTS POR PRIMERA VEZ (DROPSCHEMA Y SYNCHRONIZE DEBEN SER TRUE)
    //FIXME ADEMAS EN LAS ENTIDADES DE MASTER DB DEBEN ESTAR LAS DE MASTER_MODULES(SUSTITUYE A MASTER_DATA)
    // 2. Conexión explícita al Tenant A (PARA CREAR ESQUEMA)
    // TypeOrmModule.forRoot({
    //   ...tenantDbConfigTemplate, // Usar plantilla de tenant
    //   name: 'tenant_a_connection', // nombre único es CRÍTICO!
    //   database: 'pos_tenant_a_db', // Sobrescribir el nombre de la DB
    //   // 'synchronize' ya viene de la plantilla. Se activará si ENABLE_TENANT_SYNC es 'true'
    // }),

    // // 3. Conexión explícita al Tenant B (PARA CREAR ESQUEMA)
    // TypeOrmModule.forRoot({
    //   ...tenantDbConfigTemplate, // Usar la misma plantilla
    //   name: 'tenant_b_connection', // nombre único!
    //   database: 'pos_tenant_b_db', // Sobrescribe con el otro nombre de DB
    // }),

    TenantConnectionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      global: true,
    }),
    AuthModule,
    TodosModule,
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
    User,
    Size,
    VariantSizesModule,
    ColorModule,
    CancellationReasonModule,
    CancellationModule,
    ShipmentsModule,
    ChatModule,
    MasterDataModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'customers', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'customers/:id/test-connection', method: RequestMethod.GET },
        { path: 'stripe/webhook', method: RequestMethod.POST },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
