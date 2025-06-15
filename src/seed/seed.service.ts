import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from 'src/modules/temp-entities/employee.placeholder.entity';
import { Product } from 'src/modules/temp-entities/product.placeholder.entity';
import { TypeOfPayment } from 'src/modules/temp-entities/type-of-payment.placeholder.entity';
import { Client } from 'src/modules/temp-entities/client.placeholder.entity';
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(TypeOfPayment)
    private readonly paymentRepo: Repository<TypeOfPayment>,
  ) {}

  async onModuleInit() {
    console.log('🌱 Insertando datos de prueba...');

    await this.clientRepo.save({ id_client: 1, name: 'Juan Pérez', email: 'juan@example.com' });
    await this.employeeRepo.save({ id: 1, name: 'Empleado 1' });

    await this.productRepo.save([
      { id: 1, name: 'Zapatilla blanca', price: 1499.99 },
      { id: 2, name: 'Remera negra', price: 1000.00 },
    ]);

    await this.paymentRepo.save({ id: 1, name: 'Efectivo' });

    console.log('✅ Datos insertados correctamente.');
  }
}
