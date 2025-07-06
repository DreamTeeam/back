import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import {Repository } from 'typeorm';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class RolesService {
  constructor(@InjectTenantRepository(Role) private readonly roleRepository: Repository<Role>) {}
  getTodos() {
    return this.roleRepository.find();
  }
}