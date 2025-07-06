import { Module } from '@nestjs/common';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider'; 
import { CutsController } from './cut.controller';
import { CutsService } from './cut.service';
import { CutRepository } from './cut.repository';
import { Cut } from './cut.entity';
import { Audit } from 'src/audits/audit.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';

@Module({
  imports: [
    TenantTypeOrmModule.forFeature([Cut, Audit, Employee]), 
  ],
  controllers: [CutsController],
  providers: [CutsService, CutRepository],
})
export class CutModule {}
