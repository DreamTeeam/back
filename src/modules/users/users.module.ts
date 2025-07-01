// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Employee } from './entities/employee.entity';
import { Client } from './entities/client.entity';
import { UserSeeder } from './user.seeder';
import { Role } from '../roles/entities/role.entity';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';   

@Module({
  imports: [
    TenantTypeOrmModule.forFeature([User, Employee, Client, Role]),
    // AuthModule, // Opcional: si se necesitan Passport o el guard de roles globalmente
  ],
  controllers: [UsersController],
  providers: [UsersService, UserSeeder], 
  exports: [UserSeeder, UsersService], 
})
export class UsersModule {}