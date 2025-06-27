// src/master_modules/tenants/tenants.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { UserTenant } from '../user-tenants/entities/user-tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, UserTenant]), // Provides repositories
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService], // Export the service for AuthModule
})
export class TenantsModule {}
