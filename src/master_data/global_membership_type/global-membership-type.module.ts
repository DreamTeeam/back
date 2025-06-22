import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalMembershipTypeService } from './global-membership-type.service';
import { GlobalMembershipTypeController } from './global-membership-type.controller';
import { GlobalMembershipType } from './entities/global-membership-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GlobalMembershipType], 'masterConnection'),
  ], //! Especificar la conexión
  providers: [GlobalMembershipTypeService],
  controllers: [GlobalMembershipTypeController],
  exports: [GlobalMembershipTypeService],
})
export class GlobalMembershipTypeModule {}
