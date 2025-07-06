import { Injectable } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { InjectTenantRepository } from '../common/typeorm-tenant-repository/tenant-repository.decorator';
import { Cut } from './cut.entity';
import { Audit } from '../audits/audit.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';

@Injectable()
export class CutRepository {
  constructor(
    @InjectTenantRepository(Cut)
    private readonly cutRepo: Repository<Cut>,

    @InjectTenantRepository(Audit)
    private readonly auditRepo: Repository<Audit>,

    @InjectTenantRepository(Employee) 
    public readonly employeeRepo: Repository<Employee>,
  ) {}

  async getUnassignedAudits() {
    return this.auditRepo.find({ where: { cut: IsNull() } });
  }

  createCut(data: Partial<Cut>) {
    const newCut = this.cutRepo.create(data);
    return this.cutRepo.save(newCut);
  }

  assignAuditsToCut(auditIds: string[], cutId: string) {
    return Promise.all(
      auditIds.map((id) => this.auditRepo.update(id, { cut: { id: cutId } })),
    );
  }

  findAll() {
    return this.cutRepo.find({ relations: ['employee', 'audits'] });
  }

  findOne(id: string) {
    return this.cutRepo.findOne({
      where: { id },
      relations: ['employee', 'audits'],
    });
  }

  updateCut(id: string, updateDto: Partial<Cut>) {
    return this.cutRepo.update(id, updateDto).then(() => this.findOne(id));
  }

  softDelete(id: string) {
    return this.cutRepo.softDelete(id);
  }
}
