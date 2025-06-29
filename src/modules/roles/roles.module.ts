import { Module } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { RoleSeeder } from './role.seeder';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';
TenantTypeOrmModule

@Module({
  imports: [TenantTypeOrmModule.forFeature([Role])],
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





// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Role } from './entities/role.entity';
// import { RoleSeeder } from './role.seeder';
// import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';

// @Module({
//   imports: [TenantTypeOrmModule.forFeature([Role])],
//   providers: [
//     RoleSeeder,
//   ],
//   exports: [
//     RoleSeeder,
//   ],
// })
// export class RolesModule {}
