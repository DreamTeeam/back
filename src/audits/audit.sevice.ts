import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';
import { extractEmployeeIdFromToken } from 'src/modules/temp-entities/helpers/extract-empoyee-id.helper'; // opcional
import { Employee } from 'src/modules/users/entities/employee.entity'; // 👈 Asegurate que este path sea correcto según tu estructura

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async create(dto: CreateAuditDto, token?: string) {
    const pendingOrders = await this.repo.getPendingOrders();

    const { cash, card, transfer } = this.repo.calculateSalesTotals(pendingOrders);

    const auditData = {
      description: dto.description,
      totalCash: dto.totalCash,
      totalCashSales: cash,
      totalCardSales: card,
      totalTransferSales: transfer,
      saleCount: pendingOrders.length,
      employee: {
        id: token ? extractEmployeeIdFromToken(token) : dto.employeeId,
      } as Employee, // 👈 Esto evita el error de TypeScript
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
    };

    return this.repo.createAuditWithOrders(auditData, pendingOrders);
  }

  findAll() {
    return this.repo.findAll();
  }

  async update(id: number, dto: UpdateAuditDto) {
    await this.repo.update(id, dto);
    const updated = await this.repo.findOne(id);
    if (!updated) throw new NotFoundException(`Audit #${id} no encontrado`);
    return updated;
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  async remove(id: number) {
    await this.repo.softDelete(id);
    return { message: 'Audit eliminado correctamente' };
  }
}
