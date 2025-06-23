import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import typeorm from './config/typeorm';
//! Inicializar la conexión maestra
import typeormConfig, { masterDbConfig } from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
//FIXME Importa la plantilla del tenant también(rEVISAR NOMBRES DE IMPORTACIÓN EN CASO DE SER NECESARIO)
import typeormConfigAlias, { tenantDbConfigTemplate } from './config/typeorm'; 
import { JwtModule } from '@nestjs/jwt'; //! Necesario si TenantMiddleware decodifica JWT


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
import { SizeModule } from './modules/sizeProduct/size-product.module';
import { MembershipStatusModule } from './catalogues/MembershipStatus/membership-status.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { MembershipTypesModule } from './modules/subscriptions/membershipTypes/membership-types.module';
import { MembershipsModule } from './modules/subscriptions/membership/memberships.module';
import { CutModule } from './cuts/cut.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';

//! Master module
import { MasterDataModule } from './master_data/master_data.module';
//! TenantConnectionModule
import { TenantConnectionModule } from './common/tenant-connection/tenant-connection.module';
//! TenantMiddleware; funciona junto con el AuthModule
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { User } from './modules/users/entities/user.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfigAlias],
    }),
    //HACK Esta conexión por defecto ('nivo') se puede mantener temporalmente para pruebas
    //$ o en caso de tener rutas que NO están ligadas a un tenant específico (ej. la ruta de login
    //$ para los empleados de las zapaterías, antes de que se establezca el contexto del tenant).
    //$ Sin embargo, para la mayoría de los módulos de POS, esta conexión será reemplazada
    //$ por la conexión dinámica inyectada por el TenantInterceptor.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm')!,
      //HACK Se puedee comentar esta configuración temporalmente si solo se quiere que la aplicación
      //$ intente conectarse a la DB del tenant de forma dinámica en lugar de una por defecto.
      //$ Si se deja, la conexión 'default' seguirá apuntando a 'nivo'.
    }),
    //! CONFIGURACIÓN BASE DE DATOS MAESTRA
    TypeOrmModule.forRoot(masterDbConfig),
    //! Importa el TenantConnectionModule
    TenantConnectionModule,

    //FIXME Configuración global de JWT (si es necesaria fuera de AuthModule, por ejemplo, en TenantMiddleware)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      global: true, //! Lo hace disponible globalmente
    }),
    //Entidades
    AuthModule, //BUG AutjModulke tiene que estar listado antes que  el TenantMiddleware en configure() en caso de usar JWT para identificar el tenant
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
    ShipmentsModule,
    User,
    //! MasterDataModule (usa la conexión 'masterConnection')
    MasterDataModule,
  ],
  controllers: [],
  providers: [],
})
  
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      //FIXME Excluye las rutas que no necesitan un tenant (ej. login, registro de zapaterías)
      .exclude(
        { path: 'customers', method: RequestMethod.POST }, //! Para registrar una nueva zapatería
        { path: 'auth/login', method: RequestMethod.POST }, //!  ruta de login principal
        { path: 'customers/:id/test-connection', method: RequestMethod.GET }, //! ruta de prueba temporal
        //FIXME aquí se cualquier otra ruta que sea global y no requiera un tenant
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL }); //! Aplica el middleware a todas las demás rutas
  }
}
