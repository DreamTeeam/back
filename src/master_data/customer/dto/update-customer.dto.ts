import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;
}
