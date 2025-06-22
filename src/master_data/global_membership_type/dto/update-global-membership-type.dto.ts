import { PartialType } from '@nestjs/mapped-types';
import { CreateGlobalMembershipTypeDto } from './create-global-membership-type.dto';

export class UpdateGlobalMembershipTypeDto extends PartialType(
  CreateGlobalMembershipTypeDto,
) {}
