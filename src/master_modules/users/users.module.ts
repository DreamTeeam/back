// src/master_modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserTenant } from '../user-tenants/entities/user-tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTenant]), // Provides repositories for User and UserTenant
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export the service so AuthModule can use it
})
export class UsersModule {}
