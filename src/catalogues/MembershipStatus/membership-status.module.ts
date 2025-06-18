import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipStatus } from './entities/membership-status.entity';
import { MembershipStatusService } from './membership-status.service';
import { MembershipStatusController } from './membership-status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipStatus])],
  providers: [MembershipStatusService],
  controllers: [MembershipStatusController],
})
export class MembershipStatusModule {}