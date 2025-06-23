import { Module, Provider, Scope, Type, DynamicModule } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TENANT_REPOSITORY_KEY } from './tenant-repository.constants';
import { TenantConnectionService } from '../tenant-connection/tenant-connection.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { Reflector } from '@nestjs/core'; // Importa Reflector

//FIXME
// uyn token único para el proveedor que leerá los metadatos
// se puede usar un símbolo o una cadena única,
// aunque nestjs loa puede deducir si el decorador setmetada se aplica correctamente

export function createTenantRepositoryProvider<T extends ObjectLiteral>(
  entity: Type<T>,
): Provider {
  return {
    //! El token de inyección es el mismo que TypeOrmModule.forFeature generaría
    provide: getRepositoryToken(entity),
    //! useFactory se ejecuta para cada solicitud (debido al Scope.REQUEST)
    useFactory: (
      tenantConnectionService: TenantConnectionService,
    ): Repository<T> => {
      const dataSource =
        tenantConnectionService.getTenantDataSourceFromContext();
      return dataSource.getRepository(entity);
    },
    //! TenantConnectionService debe de estar disponible
    inject: [TenantConnectionService],
    //! Esto es crucial: asegura que una nueva instancia del repositorio se cree por cada solicitud
    scope: Scope.REQUEST,
  };
}

/*
  & modulo auxiliar para reemplazar TypeOrmModule.forFeature
  & genera los proveedores de repositorios de tenant para las entidades dadas
 */
  @Module({})
  export class TenantTypeOrmModule {
    static forFeature(entities: Type[]): DynamicModule {
      const providers = entities.map((entity) =>
        createTenantRepositoryProvider(entity),
      );

      return {
        module: TenantTypeOrmModule,
        providers: providers,
        exports: providers,
      };
    }
  }
