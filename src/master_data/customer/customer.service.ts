import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer, 'masterConnection') // !Especificar la conexión
    private customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  findAll(): Promise<Customer[]> {
    return this.customerRepository.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async findOneBySlug(slug: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { slug } });
    if (!customer) {
      throw new NotFoundException(`Customer with slug "${slug}" not found`);
    }
    return customer;
  }

  //? PREGUNTAR: agregue este metodo para buscar customers por email, ya que desde los metadatos de stripe recibo email
  async findOneByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email } });
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer | null> {
    const customer = await this.findOne(id);
    await this.customerRepository.update(id, updateCustomerDto);
    return this.customerRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.softDelete(id);
  }
}
