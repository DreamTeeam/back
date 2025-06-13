import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosModule } from './modules/todos/todos.module';
import { AuditModule } from './modules/audits/audit.module';
import { CutModule } from './modules/cuts/cut.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
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
    AuditModule,
    CutModule,
    CheckoutModule,
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
