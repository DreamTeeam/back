import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TodosModule } from './modules/todos/todos.module';
import { AuditModule } from './modules/audits/audit.module';
import { CutModule } from './modules/cuts/cut.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { Client } from './modules/temp-entities/client.placeholder.entity'; 
import { Employee } from './modules/temp-entities/employee.placeholder.entity'; 
import { Product } from './modules/temp-entities/product.placeholder.entity'; 
import { TypeOfPayment } from './modules/temp-entities/type-of-payment.placeholder.entity'; 
import { SeedService } from './seed/seed.service';

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
    AuditModule,
    CutModule,
    CheckoutModule,
  ],
  providers: [SeedService], 
})
export class AppModule {}




// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import typeorm from './config/typeorm';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { TodosModule } from './modules/todos/todos.module';
// import { AuditModule } from './modules/audits/audit.module';
// import { CutModule } from './modules/cuts/cut.module';
// import { CheckoutModule } from './modules/checkout/checkout.module';
// import { TypeOfPayment } from './modules/temp-entities/type-of-payment.placeholder.entity';
// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//       load: [typeorm],
//     }),
//     TypeOrmModule.forRootAsync({
//       inject: [ConfigService],
//       useFactory: (config: ConfigService) => config.get('typeorm')!,
//     }),
//     TodosModule,
//     AuditModule,
//     CutModule,
//     CheckoutModule,
    
//   ],
//   controllers: [],
//   providers: [],
// })
// export class AppModule {}
