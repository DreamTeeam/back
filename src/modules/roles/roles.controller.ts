import { Controller, Get, Post } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService:RolesService) {}
  @Get()
  async getTodos() {
    return this.rolesService.getTodos();
  }
}