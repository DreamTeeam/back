import { Injectable } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { InjectTenantRepository } from '../common/typeorm-tenant-repository/tenant-repository.decorator';
import { Audit } from './audit.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { PaymentMethod } from 'src/modules/orders/payment-method.enum';

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
      //relations: ['type_of_payment'], // relación correcta según tu entity
    });
  }

  calculateSalesTotals(orders: Order[]) {
    let cash = 0;
    let card = 0;
    //let transfer = 0;

    for (const order of orders) {
      // Leemos directamente de la propiedad de la orden
      if (order.payment_method === PaymentMethod.Efectivo) {
        // <-- CAMBIO AQUÍ
        cash += +order.total_order;
      } else if (order.payment_method === PaymentMethod.Tarjeta) {
        // <-- CAMBIO AQUÍ
        card += +order.total_order;
      }
    }
    return { cash, card };
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
