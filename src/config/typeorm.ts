import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

dotenvConfig({ path: '.env' });

//HACK --- Configuración para la Base de Datos del TENANT (Plantilla) ---
//HACK Esta plantilla será usada por TenantConnectionService para crear conexiones dinámicas.
//HACK NOTA: 'host', 'port', 'username', 'password', 'database' se sobreescribirán por 'url'
//HACK en TenantConnectionService usando la `dbConnectionString` del cliente.
export const tenantDbConfigTemplate: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  // entities: ['dist/**/*.entity{.ts,.js}'],
  // entities: [__dirname + '/../**/*.entity.{ts,js}'],
  entities: [join(__dirname, '/../**/*.entity.{js,ts}')],
  migrations: ['dist/migrations/*{.ts,.js}'],
  // autoLoadEntities: true,
  dropSchema: true,
  synchronize:
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_TENANT_SYNC === 'true',
};

//HACK --- Configuración para la Base de Datos MAESTRA ---
import { Customer } from '../master_data/customer/entities/customer.entity';
import { CompanySubscription } from '../master_data/company_subscription/entities/company-subscription.entity';
import { GlobalMembershipType } from '../master_data/global_membership_type/entities/global-membership-type.entity';

export const masterDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || '5432', 10),
  username: process.env.MASTER_DB_USERNAME || 'postgres',
  password: process.env.MASTER_DB_PASSWORD || '',
  database: process.env.MASTER_DB_DATABASE || '',
  entities: [Customer, CompanySubscription, GlobalMembershipType], //! Solo las entidades de la DB Maestra
  dropSchema: true,
  synchronize: true,
  name: 'masterConnection',
};

// --- Exportación para Nest ConfigModule ---
// export default registerAs('typeorm', () => tenantDbConfigTemplate);  //XXX Esta líea es sustituida por:

// --- Exportación para Nest ConfigModule ---
// export default registerAs('typeorm', () => tenantDbConfigTemplate);  //XXX Esta líea es sustituida por:

export const typeormConfig = tenantDbConfigTemplate; //XXX este par de líneas
export default registerAs('typeorm', () => typeormConfig);

// import { registerAs } from '@nestjs/config';
// import { TypeOrmModuleOptions } from '@nestjs/typeorm';
// import { config as dotenvConfig } from 'dotenv';

// dotenvConfig({ path: '.env' });

// const tenantDbConfig: TypeOrmModuleOptions = {
//   type: 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '5432', 10),
//   username: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || '',
//   // entities: ['dist/**/*.entity{.ts,.js}'],
//   // entities: [__dirname + '/../**/*.entity.{ts,js}'],
//   // migrations: ['dist/migrations/*{.ts,.js}'],
//   autoLoadEntities: true,
//   dropSchema: true,
//   synchronize: true,
// };

// // --- Configuración para la Base de Datos MAESTRA ---
// import { Customer } from '../master_data/customer/entities/customer.entity';
// import { CompanySubscription } from '../master_data/company_subscription/entities/company-subscription.entity';
// import { GlobalMembershipType } from '../master_data/global_membership_type/entities/global-membership-type.entity';

// export const masterDbConfig: TypeOrmModuleOptions = {
//   type: 'postgres',
//   host: process.env.MASTER_DB_HOST || 'localhost',
//   port: parseInt(process.env.MASTER_DB_PORT || '5432', 10),
//   username: process.env.MASTER_DB_USERNAME || 'postgres',
//   password: process.env.MASTER_DB_PASSWORD || '',
//   database: process.env.MASTER_DB_DATABASE || '',
//   entities: [Customer, CompanySubscription, GlobalMembershipType],
//   dropSchema: true,
//   synchronize: true,
//   name: 'masterConnection',
// };

// // export const typeormConfig = config;
// // export default registerAs('typeorm', () => config);

// // export default registerAs('typeorm', () => tenantDbConfig);

// export const typeormConfig = tenantDbConfig;
// export default registerAs('typeorm', () => typeormConfig);
// export const tenantDbConfigTemplate = tenantDbConfig;
