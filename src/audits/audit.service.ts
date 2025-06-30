import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';
import { Employee } from '../modules/users/entities/employee.entity';

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async create(dto: CreateAuditDto, user: any) {
    const userId = user.userId || user.sub;
    if (!userId) throw new UnauthorizedException('Token inválido');

    const employee = await this.repo.employeeRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!employee) throw new UnauthorizedException('Empleado no encontrado');

    const pendingOrders = await this.repo.getPendingOrders();

    const { cash, card } = this.repo.calculateSalesTotals(pendingOrders);

    const auditData = {
      description: dto.description,
      totalCash: cash + card,
      totalCashSales: cash,
      totalCardSales: card,
      saleCount: pendingOrders.length,
      employee,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
    };

    return this.repo.createAuditWithOrders(auditData, pendingOrders);
  }

  findAll() {
    return this.repo.findAll();
  }

  async update(id: string, dto: UpdateAuditDto) {
    await this.repo.update(id, dto);
    const updated = await this.repo.findOne(id);
    if (!updated) throw new NotFoundException(`Audit #${id} no encontrado`);
    return updated;
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { message: 'Audit eliminado correctamente' };
  }
}








// import { Injectable, NotFoundException } from '@nestjs/common';
// import { AuditRepository } from './audit.repository';
// import { CreateAuditDto } from './create-auditDto';
// import { UpdateAuditDto } from './update-auditDto';
// import { Employee } from '../modules/users/entities/employee.entity'; 
// import * as jwt from 'jsonwebtoken';
// import { UnauthorizedException } from '@nestjs/common';
// @Injectable()
// export class AuditService {
//   constructor(private readonly repo: AuditRepository) {}

//  async create(dto: CreateAuditDto, user: any) {
//   const userId = user.userId || user.sub;

//   if (!userId) throw new UnauthorizedException('Token inválido');

//   const employee = await this.repo.employeeRepo.findOne({
//     where: { user: { id: userId } },
//   });

//   if (!employee) throw new UnauthorizedException('Empleado no encontrado');

//   const pendingOrders = await this.repo.getPendingOrders();
//   const { cash, card } = this.repo.calculateSalesTotals(pendingOrders);

//   const auditData = {
//     description: dto.description,
//     totalCash: cash + card,
//     totalCashSales: cash,
//     totalCardSales: card,
//     saleCount: pendingOrders.length,
//     employee: { id: employee.id },
//     date: new Date().toISOString().split('T')[0],
//     time: new Date().toTimeString().split(' ')[0],
//   };

//   return this.repo.createAuditWithOrders(auditData, pendingOrders);
// }


//   findAll() {
//     return this.repo.findAll();
//   }

//   async update(id: string, dto: UpdateAuditDto) {
//     await this.repo.update(id, dto);
//     const updated = await this.repo.findOne(id);
//     if (!updated) throw new NotFoundException(`Audit #${id} no encontrado`);
//     return updated;
//   }

//   findOne(id: string) {
//     return this.repo.findOne(id);
//   }

//   async remove(id: string) {
//     await this.repo.softDelete(id);
//     return { message: 'Audit eliminado correctamente' };
//   }
// }
