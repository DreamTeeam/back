import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async auditCreate(params: {
    data: any;
    entityId: string;
    entityName: string;
    employeeId: string;
  }) {
    const changes = Object.entries(params.data).map(([field, value]) => ({
      entityId: params.entityId,
      entityName: params.entityName,
      fieldName: field,
      oldValue: null,
      newValue: JSON.stringify(value),
      employeeId: String(params.employeeId) === '0' || !params.employeeId
  ? '11111111-1111-1111-1111-111111111111'
  : params.employeeId,
      active: true,
    }));

    await this.auditRepo.save(changes);
  }

  async auditUpdate(params: {
    oldEntity: any;
    newData: any;
    entityId: string;
    entityName: string;
    employeeId: string;
  }) {
    const changes: Partial<AuditLog>[] = [];

    for (const field of Object.keys(params.newData)) {
      const oldValue = params.oldEntity[field];
      const newValue = params.newData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          entityId: params.entityId,
          entityName: params.entityName,
          fieldName: field,
          oldValue: JSON.stringify(oldValue),
          newValue: JSON.stringify(newValue),
          employeeId: params.employeeId,
          active: true,
        });
      }
    }

    if (changes.length > 0) {
      await this.auditRepo.save(changes);
    }
  }

  async auditDelete(params: {
    oldEntity: any;
    entityId: string;
    entityName: string;
    employeeId: string;
  }) {
    const change: Partial<AuditLog> = this.auditRepo.create({
      entityId: params.entityId,
      entityName: params.entityName,
      fieldName: 'deleted',
      oldValue: JSON.stringify(params.oldEntity),
      newValue: undefined,
      employeeId: params.employeeId,
      active: true,
    });

    await this.auditRepo.save(change);
  }
}
