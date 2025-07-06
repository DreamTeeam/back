import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectTenantRepository } from '../../common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class RoleSeeder {
  constructor(
    @InjectTenantRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed() {
    const defaultRoles = [
      {
        name: 'SUPERADMIN',
        description: 'Super Administrator with full and special system access.',
      },
      {
        name: 'ADMIN',
        description: 'Administrator with full system access.',
      },
      {
        name: 'MANAGER',
        description:
          'Manager with access to employee and inventory management.',
      },
      {
        name: 'CASHIER',
        description: 'Cashier with access to the Point of Sale module.',
      },
    ];

    await this.roleRepository.upsert(defaultRoles, ['name']);

    console.log('Roles seeded successfully!');
  }
}
