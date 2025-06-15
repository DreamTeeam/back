import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cut } from './cut.entity';
import { Repository, IsNull, FindOneOptions } from 'typeorm';
import { Audit } from 'src/audits/audit.entity';

@Injectable()
export class CutRepository {
  constructor(
    @InjectRepository(Cut)
    private readonly cutRepo: Repository<Cut>,

    @InjectRepository(Audit)
    private readonly auditRepo: Repository<Audit>,
  ) {}

  async getUnassignedAudits() {
    return this.auditRepo.find({
      where: { cutId: IsNull() },
    });
  }

  async createCut(data: Partial<Cut>) {
    const newCut = this.cutRepo.create(data);
    return this.cutRepo.save(newCut);
  }

  async assignAuditsToCut(auditIds: number[], cutId: number) {
    await Promise.all(
      auditIds.map((id) =>
        this.auditRepo.update(id, { cutId }),
      ),
    );
  }

  async findAll() {
    return this.cutRepo.find({
      where: { deletedAt: IsNull() }
    });
  }

  async updateCut(id: number, updateDto: Partial<Cut>) {
    await this.cutRepo.update(id, updateDto);
    return this.cutRepo.findOne({ where: { id } });
  }

  async softDelete(id: number) {
  return this.cutRepo.softDelete(id);
}

async findOne(options: FindOneOptions<Cut>) {
  if (!options.where || !('deletedAt' in options.where)) {
    options.where = { ...options.where, deletedAt: IsNull() };
  }
  return this.cutRepo.findOne(options);
}

// async findOne(where: Partial<Cut>) {
//   if (!('deletedAt' in where)) {
//  return this.cutRepo.findOne({ where: { ...where, deletedAt: IsNull() } });
//   }
//   return this.cutRepo.findOne({ where });
//   }

}
