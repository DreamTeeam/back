import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { UpdateAuditDto } from './update-auditDto';
import { CreateAuditDto } from './create-auditDto';
@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async create(createAuditDto: CreateAuditDto) {
     const unassignedOrders = await this.auditRepository.getUnassignedOrders();

     let totalCashSales = 0;
     let totalCardSales = 0;
     let totalTransferSales = 0;

     for (const order of unassignedOrders) {
  if (order.type_of_payment?.name === 'Efectivo') totalCashSales += +order.total_order;
  else if (order.type_of_payment?.name === 'Tarjeta') totalCardSales += +order.total_order;
  else if (order.type_of_payment?.name === 'Transferencia') totalTransferSales += +order.total_order;
}


    const auditData = {
      ...createAuditDto,
       totalCashSales,
       totalCardSales,
       totalTransferSales,
       saleCount: unassignedOrders.length,
       totalCash: createAuditDto.totalCash ?? 0,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      cutId: undefined,
    };

    const audit = await this.auditRepository.createAudit(auditData);

     const orderIds = unassignedOrders.map((order) => order.id);
     await this.auditRepository.assignOrdersToAudit(orderIds, audit.id);

    return audit;
  }

 async findAll() {
    return this.auditRepository.findAll();
  }

  async update(id: string, updateAuditDto: UpdateAuditDto) {
    return this.auditRepository.updateAudit(id, updateAuditDto);
  }

async remove(id: number) {
 const audit = await this.auditRepository.findOneById(id);

  if (!audit) {
    throw new NotFoundException(`Audit con id ${id} no encontrado.`);
  }
  await this.auditRepository.softDelete(id);
  return { message: `Audit con id ${id} eliminado correctamente.` };
}




}
