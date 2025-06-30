import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RoleSeeder } from './modules/roles/role.seeder';
import { UserSeeder } from './modules/users/user.seeder';
import { TenantConnectionService } from './common/tenant-connection/tenant-connection.service';

import { runInTenantContext } from './common/context/tenant-context';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);

  const tenantConnectionService = appContext.get(TenantConnectionService);

  const tenantIdsToSeed = ['8a38e67c-62e6-42c7-acac-a2a30231dd5c']; // Tu ID de ejemplo

  try {
    console.log('Iniciando proceso de seeding...');

    for (const customerId of tenantIdsToSeed) {
      console.log(`\n--- Ejecutando seeders para el tenant: ${customerId} ---`);

      let tenantDataSource;
      try {
        tenantDataSource =
          await tenantConnectionService.getTenantDataSource(customerId);
      } catch (dataSourceError) {
        console.error(
          `No se pudo obtener/crear DataSource para el tenant ${customerId}:`,
          dataSourceError,
        );
        continue;
      }

      await runInTenantContext(
        {
          customerId: customerId,
          tenantDataSource: tenantDataSource,
        },
        async () => {
          let roleSeederInstance: RoleSeeder | undefined;
          let userSeederInstance: UserSeeder | undefined;

          try {
            // Aquí resolvemos las instancias. NestJS manejará su ciclo de vida.
            roleSeederInstance = await appContext.resolve(RoleSeeder);
            userSeederInstance = await appContext.resolve(UserSeeder);

            if (roleSeederInstance) {
              await roleSeederInstance.seed();
            } else {
              console.warn(
                `RoleSeederInstance no pudo ser resuelta para el tenant ${customerId}.`,
              );
            }

            if (userSeederInstance) {
              await userSeederInstance.seed();
            } else {
              console.warn(
                `UserSeederInstance no pudo ser resuelta para el tenant ${customerId}.`,
              );
            }

            console.log(`Seeding completado para el tenant: ${customerId}`);
          } catch (innerError) {
            console.error(
              `Error durante el seeding para el tenant ${customerId}:`,
              innerError,
            );
            // Puedes decidir si lanzar el error aquí o solo loguearlo
            // throw innerError;
          } finally {
            // ! ELIMINAMOS LAS LLAMADAS A appContext.release().
            // ! appContext.close() al final del script se encargará de la limpieza general.
            // ! NestJS maneja la destrucción de instancias de Scope.REQUEST cuando el contexto de la aplicación se cierra.
          }
        },
      );
    }

    console.log('\n--- Proceso de seeding finalizado ---');
  } catch (error) {
    console.error('El proceso de seeding falló globalmente:', error);
  } finally {
    // ! Esto cerrará todos los DataSources de tenants y luego el contexto general de la aplicación.
    await tenantConnectionService.onModuleDestroy();
    await appContext.close();
  }
}

bootstrap();
