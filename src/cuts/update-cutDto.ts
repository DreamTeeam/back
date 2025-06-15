import { PartialType } from '@nestjs/mapped-types';
import { CreateCutDto } from './create-cutDto';

export class UpdateCutDto extends PartialType(CreateCutDto) {}
