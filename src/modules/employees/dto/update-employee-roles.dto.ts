import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateEmployeeRolesDto {
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each roleId must be a valid UUID' })
  @IsNotEmpty()
  roleIds: string[];
}
