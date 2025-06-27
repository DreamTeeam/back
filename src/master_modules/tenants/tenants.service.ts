// src/master_modules/tenants/tenants.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { UserTenant } from '../user-tenants/entities/user-tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
  ) {}

  /**
   * Finds a tenant by their unique slug.
   * Needed for public client registration.
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  /**
   * Finds a tenant by their global ID.
   */
  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id } });
  }

  /**
   * Finds all tenant memberships for a given user.
   * Crucial for the login flow to see if a user has 1 or more tenants.
   */
  async findUserMemberships(userId: string): Promise<UserTenant[]> {
    return this.userTenantRepository.find({
      where: { user: { id: userId } },
      relations: ['tenant'], // Load tenant info along with the membership
    });
  }

  /**
   * Finds a single, specific membership for a user in a tenant.
   * Needed when generating a token for a selected tenant.
   */
  async findUserMembership(
    userId: string,
    tenantId: string,
  ): Promise<UserTenant | null> {
    return this.userTenantRepository.findOne({
      where: {
        user: { id: userId },
        tenant: { id: tenantId },
      },
    });
  }
}
