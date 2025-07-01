import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';
import { Employee } from '../modules/users/entities/employee.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly repo: AuditRepository) {}

  async create(dto: CreateAuditDto, user: any) {
    this.logger.log('--- Iniciando proceso de creación de Arqueo ---');
    const userId = user.userId || user.sub;
    if (!userId) throw new UnauthorizedException('Token inválido');
    this.logger.log(`Buscando empleado para userId: ${userId}`);

    const employee = await this.repo.employeeRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!employee) throw new UnauthorizedException('Empleado no encontrado');
    this.logger.log(`Empleado encontrado: ${employee.id}`);

    this.logger.log('Buscando órdenes pendientes (con audit_id nulo)...');
    const pendingOrders = await this.repo.getPendingOrders();
    this.logger.log(
      `Se encontraron ${pendingOrders.length} órdenes pendientes.`,
    );

    if (pendingOrders.length === 0) {
      this.logger.warn(
        'No hay órdenes pendientes para procesar. El arqueo se creará con valores en cero.',
      );
    } else {
      // Mostramos una o dos órdenes para inspeccionar sus valores
      this.logger.log(
        'Inspeccionando las primeras 2 órdenes encontradas (si existen):',
      );
      console.log(pendingOrders.slice(0, 2));
    }

    this.logger.log('Calculando totales de ventas a partir de las órdenes...');
    const { cash, card } = this.repo.calculateSalesTotals(pendingOrders);
    this.logger.log(
      `Totales calculados -> Efectivo (cash): ${cash}, Tarjeta (card): ${card}`,
    );

    const auditData = {
      description: dto.description,
      total_cash: cash + card, //pase todo de camelCase a snake_case
      total_cash_sales: cash,
      total_card_sales: card,
      sale_count: pendingOrders.length,
      employee,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
    };
    this.logger.log('Datos del ARQUEO a punto de ser guardados:');
    console.log(auditData);

    this.logger.log(
      'Llamando al repositorio para crear el arqueo y actualizar las órdenes...',
    );
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
