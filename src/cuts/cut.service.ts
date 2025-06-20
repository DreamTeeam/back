import { Injectable, NotFoundException } from '@nestjs/common';
import { CutRepository } from './cut.repository';
import { CreateCutDto } from './create-cutDto';
import { extractEmployeeIdFromToken } from 'src/modules/temp-entities/helpers/extract-empoyee-id.helper';
import { IsNull } from 'typeorm';

@Injectable()
export class CutService {
  constructor(private readonly cutRepo: CutRepository) {}

  async create(createCutDto: Partial<CreateCutDto>, token: string) {

   const employeeId = extractEmployeeIdFromToken(token); 
   const unassignedAudits = await this.cutRepo.getUnassignedAudits();

    const auditCount = unassignedAudits.length;
    const saleCount = unassignedAudits.reduce(
      (acc, audit) => acc + audit.sale_count,
      0,
    );
    const totalAudits = unassignedAudits.reduce(
      (acc, audit) => acc + Number(audit.total_cash) || 0,
      0,
    );
    const totalCashSales = unassignedAudits.reduce(
      (acc, audit) => acc + Number(audit.total_cash_sales || 0),
      0,
    );

    const newCutData = {
      description: createCutDto.description,
      employeeId,
      auditCount,
      saleCount,
      totalAudits,
      totalCashSales,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
    };

    const newCut = await this.cutRepo.createCut(newCutData);

    const auditIds = unassignedAudits.map((a) => a.id);
    await this.cutRepo.assignAuditsToCut(auditIds, newCut.id);

    return newCut;
  }

  findAll() {
    return this.cutRepo.findAll();
  }

  update(id: number, updateCutDto: Partial<CreateCutDto>) {
    return this.cutRepo.updateCut(id, updateCutDto);
  }

  async remove(id: number) {
  const cut = await this.cutRepo.findOne({ where: { id, deletedAt: IsNull() } });

    if (!cut) {
    throw new NotFoundException(`Cut con id ${id} no encontrado.`);
  }
  await this.cutRepo.softDelete(id);
  return { message: `Cut con id ${id} eliminado correctamente.` };
}

}
