import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Employee } from './entities/employee.entity';
import { Client } from './entities/client.entity';
import { UserSeeder } from './user.seeder';
import { Role } from '../roles/entities/role.entity';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';

@Module({
  imports: [TenantTypeOrmModule.forFeature([User, Employee, Client, Role])],
  providers: [UserSeeder],
  exports: [UserSeeder],
})
export class UsersModule {}
