import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditDto } from './create-auditDto';

export class UpdateAuditDto extends PartialType(CreateAuditDto) {}
