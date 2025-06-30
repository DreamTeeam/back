import { Injectable } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { InjectTenantRepository } from '../common/typeorm-tenant-repository/tenant-repository.decorator';
import { Audit } from './audit.entity';
import { Order } from '../modules/orders/entities/order.entity';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectTenantRepository(Audit)
    private readonly auditRepo: Repository<Audit>,

    @InjectTenantRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async getPendingOrders(): Promise<Order[]> {
    return this.orderRepo.find({
      where: { audit: IsNull() },
      relations: ['type_of_payment'],
    });
  }

  calculateSalesTotals(orders: Order[]) {
    let cash = 0;
    let card = 0;
    let transfer = 0;

    for (const order of orders) {
      const paymentName = order.payment_method ?? '';
      // const paymentName = order.type_of_payment?.name ?? '';

      if (paymentName === 'Efectivo') cash += +order.total_order;
      else if (paymentName === 'Tarjeta') card += +order.total_order;
      else if (paymentName === 'Transferencia') transfer += +order.total_order;
    }

    return { cash, card, transfer };
  }

  async createAuditWithOrders(
    auditData: Partial<Audit>,
    orders: Order[],
  ): Promise<Audit> {
    const audit = this.auditRepo.create(auditData);
    const savedAudit = await this.auditRepo.save(audit);

    await Promise.all(
      orders.map((o) => this.orderRepo.update(o.id, { audit: savedAudit })),
    );

    return savedAudit;
  }

  findAll() {
    return this.auditRepo.find({
      relations: ['employee', 'employee.roles'],
      order: { id: 'DESC' },
    });
  }

  findOne(id: string) {
    return this.auditRepo.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<Audit>) {
    return this.auditRepo.update(id, dto);
  }

  softDelete(id: string) {
    return this.auditRepo.softDelete(id);
  }
}
