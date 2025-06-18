import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from 'src/audits/audit.controller';
import { Audit } from 'src/audits/audit.entity';
import { AuditRepository } from 'src/audits/audit.repository';
import { AuditService } from 'src/audits/audit.sevice';
import { Order } from '../modules/orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audit, Order])],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
})
export class AuditModule {}
