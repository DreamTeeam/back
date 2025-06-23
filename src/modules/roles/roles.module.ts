import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleSeeder } from './role.seeder';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    RoleSeeder,
    RolesService,
  ],
  exports: [
    RoleSeeder,
  ],
  controllers: [RolesController],
})
export class RolesModule {}
