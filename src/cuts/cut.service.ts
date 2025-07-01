import { Injectable, NotFoundException } from '@nestjs/common';
import { CutRepository } from './cut.repository';
import { CreateCutDto } from './create-cutDto';
import { UpdateCutDto } from './update-cutDto';
import { InjectTenantRepository } from '../common/typeorm-tenant-repository/tenant-repository.decorator';
import { Repository } from 'typeorm';
import { Employee } from '../modules/users/entities/employee.entity';
import { Audit } from '../audits/audit.entity';

@Injectable()
export class CutsService {
  constructor(
    private readonly repo: CutRepository,

    @InjectTenantRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    @InjectTenantRepository(Audit)
    private readonly auditRepo: Repository<Audit>,
  ) {}

  async create(dto: CreateCutDto, user: any) {
    const userId = user.userId || user.sub;

    let employee = await this.repo.employeeRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!employee) {
      const userExists = await this.repo.employeeRepo.manager.findOne('User', {
        where: { id: userId },
      });

      if (userExists) {
        employee = await this.repo.employeeRepo.save({
          user: userExists,
          roles: [],
        });
      } else {
        throw new NotFoundException('Usuario no encontrado');
      }
    }

    return this.repo.createCut(dto, employee) // employee_id: employee.id,
  }

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const cut = await this.repo.findOne(id);
    if (!cut) throw new NotFoundException(`Cut #${id} not found`);
    return cut;
  }

  update(id: string, dto: UpdateCutDto) {
    return this.repo.updateCut(id, dto);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { message: 'Cut eliminado correctamente' };
  }

  async getAuditsByCut(cutId: string) {
    return this.auditRepo.find({
      where: { cut: { id: cutId } },
    });
  }
}
