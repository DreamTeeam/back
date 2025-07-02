import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Employee } from '../../modules/users/entities/employee.entity';

@Injectable()
export class IdConverterService {
  private readonly logger = new Logger(IdConverterService.name);

  constructor(private readonly entityManager: EntityManager) {}

  public async getEmployeeIdFromUserId(userId: string): Promise<string> {
    if (!userId) {
      throw new Error('El ID para la converción de usuario proporcionado es nulo o indefinido.');
    }

    const employeeRecord = await this.entityManager.findOne(Employee, {
      where: {
        user: { id: userId },
      },
      select: ['id'],
    });

    if (!employeeRecord) {
      this.logger.warn(`ID de empleado no encontrado para ${userId} de usuario`);
      throw new NotFoundException(
        `No se encontró un empleado asociado al usuario con ID: ${userId} al intentar la converción`,
      );
    }

    this.logger.log(
      `${employeeRecord.id} de empleado encontrado para ${userId} de usuario`,
    );

    return employeeRecord.id;
  }
}