import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleSeeder } from './role.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    RoleSeeder,
  ],
  exports: [
    RoleSeeder,
  ],
})
export class RolesModule {}
