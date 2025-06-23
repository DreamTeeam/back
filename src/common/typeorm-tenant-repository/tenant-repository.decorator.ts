import { Inject, SetMetadata } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TENANT_REPOSITORY_KEY } from './tenant-repository.constants';
import { Type } from '@nestjs/common';

export function InjectTenantRepository<T>(entity: Type<T>): ParameterDecorator {
  SetMetadata(TENANT_REPOSITORY_KEY, entity); //! Adjunta la entidad a los metadatos del parámetro
  return Inject(getRepositoryToken(entity)); //! Usa el token estándar de TypeORM para la inyección
}
