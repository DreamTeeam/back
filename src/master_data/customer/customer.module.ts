import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';

@Module({
  //! forFeature para esta entidad especifica el nombre de la conexión
  imports: [TypeOrmModule.forFeature([Customer], 'masterConnection')],
  providers: [CustomerService],
  controllers: [CustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}
