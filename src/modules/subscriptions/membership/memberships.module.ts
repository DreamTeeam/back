import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { Membership } from './entities/membership.entity';
import { CompanyMembership } from '../membershipTypes/entities/companyMembership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, CompanyMembership])],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
