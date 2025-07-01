import { PartialType } from '@nestjs/mapped-types';
import { CreateCutDto } from './create-cutDto';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateCutDto)
export class UpdateCutDto extends PartialType(CreateCutDto) {}