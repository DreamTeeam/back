import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';
import { Audit } from './audit.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';

@Module({
  imports: [
    TenantTypeOrmModule.forFeature([Audit, Order,Employee]),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
})
export class AuditModule {}
