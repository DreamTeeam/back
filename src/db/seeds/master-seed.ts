import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { config as dotenvConfig } from 'dotenv';
import { masterDbConfig } from '../../config/typeorm';
import { Tenant } from '../../master_modules/tenants/entities/tenant.entity';

dotenvConfig({ path: '.env' });

const tenantsToSeed = [
  {
    name: 'Zapatería A',
    slug: 'nivo-a',
    dbConnectionString: 'postgres://user:pass@host:port/pos_tenant_a_db',
  },
  {
    name: 'Zapatería B',
    slug: 'nivo-b',
    dbConnectionString: 'postgres://user:pass@host:port/pos_tenant_b_db',
  },
];

async function runSeed() {
  console.log('🌱 Iniciando seeder para la base de datos maestra...');

  // Creamos una nueva instancia de DataSource usando la configuración maestra
  const AppDataSource = new DataSource({
    ...(masterDbConfig as PostgresConnectionOptions),
    synchronize: false,
    dropSchema: false,
    logging: ['error'], // ajustar el logging para ver solo errores
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión con la base de datos maestra establecida.');

    const tenantRepository = AppDataSource.getRepository(Tenant);

    for (const tenantData of tenantsToSeed) {
      // Verificar si el tenant ya existe por su 'slug' para no duplicar
      const existingTenant = await tenantRepository.findOneBy({
        slug: tenantData.slug,
      });

      if (!existingTenant) {
        const newTenant = tenantRepository.create(tenantData);
        await tenantRepository.save(newTenant);
        console.log(`👍 Tenant "${tenantData.name}" creado exitosamente.`);
      } else {
        console.log(`ℹ️ Tenant "${tenantData.name}" ya existe, se omite.`);
      }
    }

    console.log('🎉 Seeder finalizado correctamente.');
  } catch (error) {
    console.error('❌ Error durante la ejecución del seeder:', error);
  } finally {
    // Cerrar la conexión para que el script pueda terminar
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexión con la base de datos cerrada.');
    }
  }
}

// Ejecutar la función
runSeed();
