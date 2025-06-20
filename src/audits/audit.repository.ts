import { Repository } from 'typeorm';
import { Audit } from './audit.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';
import { IsNull } from 'typeorm';
import { UpdateAuditDto } from './update-auditDto';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepo: Repository<Audit>,

     @InjectRepository(Order)
     private readonly orderRepo: Repository<Order>,
  ) {}

  async getUnassignedOrders() {
  return this.orderRepo.find({
    where: { audit: IsNull() },
    relations: ['typeOfPayment'],
  });
}

  async createAudit(audit: Partial<Audit>) {
    const newAudit = this.auditRepo.create(audit);
    return this.auditRepo.save(newAudit);
  }

   async assignOrdersToAudit(orderIds: string[], auditId: number) {
     await Promise.all(
       orderIds.map((id) =>
         this.orderRepo.update(id, { audit: { id: auditId } })
       ),
     );
   }

  async findAll() {
  return this.auditRepo.find({
     where: {
      deleted_at: IsNull(),
     }
  });

}

async updateAudit(id: string, updateAuditDto: UpdateAuditDto) {
  const auditId = parseInt(id, 10); 
  await this.auditRepo.update(auditId, updateAuditDto);
  return this.auditRepo.findOne({ where: { id: auditId } });
}


async softDelete(id: number) {
  return this.auditRepo.softDelete(id);
}

async findOneById(id: number) {
  return this.auditRepo.findOne({
    where: {
      id,
      deleted_at: IsNull(),
    },
  });
}


}
