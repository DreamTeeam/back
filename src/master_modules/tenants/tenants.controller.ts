// src/master_modules/tenants/tenants.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';

// LATER: This controller will be built out to manage tenants
// (e.g., for a super-admin panel to create, update, or suspend tenants).
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt')) // Example of a protected route
  findAll() {
    return {
      message:
        'This endpoint will list all tenants for super-admins in the future.',
    };
  }
}
