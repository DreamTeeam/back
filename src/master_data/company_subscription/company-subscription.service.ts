import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySubscription } from './entities/company-subscription.entity';
import { CreateCompanySubscriptionDto } from './dto/create-company-subscription.dto';
import { UpdateCompanySubscriptionDto } from './dto/update-company-subscription.dto';

@Injectable()
export class CompanySubscriptionService {
  constructor(
    @InjectRepository(CompanySubscription, 'masterConnection') //! especificar la conexión
    private companySubscriptionRepository: Repository<CompanySubscription>,
  ) {}

  async create(
    createDto: CreateCompanySubscriptionDto,
  ): Promise<CompanySubscription> {
    const newSubscription =
      this.companySubscriptionRepository.create(createDto);
    return this.companySubscriptionRepository.save(newSubscription);
  }

  findAll(): Promise<CompanySubscription[]> {
    return this.companySubscriptionRepository.find({
      relations: ['customer', 'membershipType'],
    });
  }

  async findOne(id: string): Promise<CompanySubscription> {
    const subscription = await this.companySubscriptionRepository.findOne({
      where: { id },
      relations: ['customer', 'membershipType'],
    });
    if (!subscription) {
      throw new NotFoundException(
        `Company Subscription with ID "${id}" not found`,
      );
    }
    return subscription;
  }

  async findActiveSubscriptionForCustomer(
    customerId: string,
  ): Promise<CompanySubscription | null> {
    return this.companySubscriptionRepository.findOne({
      where: { customer_id: customerId, status: 'active' },
      order: { end_date: 'DESC' },
      relations: ['membership_typeid'],
    });
  }

  async update(
    id: string,
    updateDto: UpdateCompanySubscriptionDto,
  ): Promise<CompanySubscription | null> {
    const subscription = await this.findOne(id);
    await this.companySubscriptionRepository.update(id, updateDto);
    return this.companySubscriptionRepository.findOne({
      where: { id },
      relations: ['customer', 'membershipType'],
    });
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.companySubscriptionRepository.softDelete(id);
  }
}
