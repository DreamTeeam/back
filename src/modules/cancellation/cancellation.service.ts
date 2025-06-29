import { Injectable, NotFoundException } from '@nestjs/common';
//import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UpdateCancellationDto } from './dto/update-cancellation.dto';
import { Cancellation } from './entities/cancellation.entity';
import { Order } from '../orders/entities/order.entity';
import { Employee } from '../users/entities/employee.entity';
import { CancellationReason } from '../../catalogues/cancellationReason/entities/cancellation-reason.entity';
import { InjectTenantRepository } from '../../common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class CancellationService {
  constructor(
    @InjectTenantRepository(Cancellation)
    private readonly cancellationRepository: Repository<Cancellation>,
  ) {}

  async create(
    data: {
      order: Order;
      employeeId: string;
      reasonId: string;
      comment?: string;
    },
    transactionalEntityManager: EntityManager,
  ): Promise<Cancellation> {
    const { order, employeeId, reasonId, comment } = data;

    const employee = await transactionalEntityManager.findOneBy(Employee, {
      id: employeeId,
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con Id "${employeeId}" no encontrado.`,
      );
    }

    const cancellationReason = await transactionalEntityManager.findOneBy(
      CancellationReason,
      { id: reasonId },
    );
    if (!cancellationReason) {
      throw new NotFoundException(
        `Motivo de cancelación con ID "${reasonId}" no encontrado.`,
      );
    }

    const newCancellation = transactionalEntityManager.create(Cancellation, {
      order,
      employee,
      cancellationReason,
      cancellation_comment: comment,
    });

    return transactionalEntityManager.save(newCancellation);
  }

  async findAll(): Promise<Cancellation[]> {
    return this.cancellationRepository.find({
      select: {
        id: true,
        cancellation_comment: true,
        created_at: true,
        order: {
          id: true,
          total_order: true,
        },
        employee: {
          id: true,

          user: {
            first_name: true,
            last_name: true,
          },
        },
      },
      relations: {
        order: true,
        employee: {
          user: true,
        },
        cancellationReason: true,
      },
    });
  }

  async findOne(id: string): Promise<Cancellation> {
    const cancellation = await this.cancellationRepository.findOne({
      where: { id },
      select: {
        id: true,
        cancellation_comment: true,
        created_at: true,
        order: { id: true, total_order: true },
        employee: { id: true, user: { first_name: true, last_name: true } },
      },
      relations: {
        order: true,
        employee: {
          user: true,
        },
        cancellationReason: true,
      },
    });

    if (!cancellation) {
      throw new NotFoundException(`Cancelación con id "${id}" no encontrada`);
    }

    return cancellation;
  }

  async update(
    id: string,
    updateCancellationDto: UpdateCancellationDto,
  ): Promise<Cancellation> {
    const cancellation = await this.findOne(id);
    const updatedCancellation = this.cancellationRepository.merge(
      cancellation,
      updateCancellationDto,
    );
    return this.cancellationRepository.save(updatedCancellation);
  }
}
