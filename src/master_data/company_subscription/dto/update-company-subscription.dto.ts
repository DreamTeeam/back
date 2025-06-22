import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanySubscriptionDto } from './create-company-subscription.dto';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export class UpdateCompanySubscriptionDto extends PartialType(
  CreateCompanySubscriptionDto,
) {
}
