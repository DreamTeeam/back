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

  // createCut(data: Partial<Cut>) {
  //   const newCut = this.cutRepo.create(data);
  //   return this.cutRepo.save(newCut);
  // }

  async createCut(data: { description: string; employee_id: string }) {
  const audits = await this.getUnassignedAudits();

  const audit_count = audits.length;
  const total_audits = audits.reduce((sum, a) => sum + Number(a.total_cash || 0), 0);
  const sale_count = audits.reduce((sum, a) => sum + (a.sale_count || 0), 0);
  const total_cash_sales = audits.reduce((sum, a) => sum + Number(a.total_cash_sales || 0), 0);
  const expense_count = audits.reduce((sum, a) => sum + (a.expense_count || 0), 0);
  const total_expenses = audits.reduce((sum, a) => sum + Number(a.total_expenses || 0), 0);

  const now = new Date();
  const date = now.toISOString().split('T')[0];       // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0];       // HH:mm:ss

  const newCut = this.cutRepo.create({
    description: data.description,
    employee_id: data.employee_id,
    audit_count,
    total_audits,
    sale_count,
    total_cash_sales,
    expense_count,
    total_expenses,
    date,
    time,
  });

  const savedCut = await this.cutRepo.save(newCut);

  const auditIds = audits.map((a) => a.id);
  await this.assignAuditsToCut(auditIds, savedCut.id);

  return savedCut;
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
