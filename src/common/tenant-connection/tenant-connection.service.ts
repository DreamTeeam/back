import {
  Injectable,
  Logger,
  OnModuleDestroy,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CustomerService } from '../../master_data/customer/customer.service';
import { tenantDbConfigTemplate } from '../../config/typeorm'; //% plantilla de configuración del tenant
import { getTenantContext } from '../context/tenant-context'; //% Importa el contexto del tenant
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

//TODO Aquí deben importar todas sus entidades del tenant(sus entidades pues).
//! las tablas de relación ManyToMany (no son entidades en sí mismas),
//! como employee_roles, tr_category_sub_category, tr_subcategory_brand, etc
//! TypeORM las creará automáticamente si sus entidades relacionadas están listadas.
//! **IMPORTANTE**: Necesitan listar *todas* sus entidades del esquema aquí
//! para que TypeORM las reconozca en cada conexión dinámica
//! Ordenenlas en vase a quien creo cada entity correspondiente y si falta algunta la agregan

//? Entidades Flor
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderDetail } from '../../modules/orders/entities/orderDetail.entity';
import { Membership } from '../../modules/subscriptions/membership/entities/membership.entity';
import { MembershipType } from 'src/modules/subscriptions/membershipTypes/entities/membershipType.entity'; //[x] Imported  //[x] Imported
import { Cancellation } from 'src/modules/cancellation/entities/cancellation.entity';
import { CompanySubscription } from 'src/master_data/company_subscription/entities/company-subscription.entity';
import { GlobalMembershipType } from 'src/master_data/global_membership_type/entities/global-membership-type.entity';

//? Entidades Steven
import { Brand } from '../../catalogues/brand/entities/brand.entity';
import { Category } from '../../catalogues/category/entities/category.entity';
import { SubCategory } from '../../catalogues/subCategory/entities/sub-category.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { ProductVariant } from '../../modules/productsVariant/entities/product-variant.entity';
import { Size } from 'src/catalogues/sizeProduct/entities/size-product.entity';
import { VariantSize } from 'src/modules/variantSIzes/entities/variantSizes.entity';
import { Color } from 'src/catalogues/colorProduct/entities/colorProduct.entity';
import { CancellationReason } from 'src/catalogues/cancellationReason/entities/cancellation-reason.entity';
import { MembershipStatus } from '../../catalogues/MembershipStatus/entities/membership-status.entity';
// import { Notification } from 'src/modules/notifications/entities/notification.entity';

//? Entidades Pia
import { Shipment } from 'src/modules/shipments/entities/shipment.entity';
import { ShipmentSize } from 'src/modules/shipments/entities/shipment-size.entity';
import { ShipmentVariant } from 'src/modules/shipments/entities/shioment-variant.entity';
import { Audit } from '../../audits/audit.entity';
import { Cut } from '../../cuts/cut.entity';

//? Entidades Ebgueny
import { Todo } from '../../modules/todos/entities/todo.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Employee } from '../../modules/users/entities/employee.entity';
import { Client } from '../../modules/users/entities/client.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Customer } from 'src/master_data/customer/entities/customer.entity';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  //% Mapa para cachear las instancias de DataSource por customerId
  private readonly dataSources: Map<string, DataSource> = new Map();

  constructor(private readonly customerService: CustomerService) {} //% Necesita CustomerService para obtener dbConnectionString

  /*
    & Obtiene o crea una conexión a la base de datos para un cliente específico (zapatería)
    & @param customerId El ID del cliente (zapatería)
    & @returns Una instancia de TypeORM DataSource para la base de datos del tenant
    & @throws NotFoundException si el cliente no se encuentra en la DB maestra
    & @throws InternalServerErrorException si falla la conexión a la DB del tenant
   */
  async getTenantDataSource(customerId: string): Promise<DataSource> {
    //% Intentar obtener la conexión del caché
    const dataSource = this.dataSources.get(customerId);

    if (dataSource) {
      if (dataSource.isInitialized) {
        this.logger.debug(`Reusing DataSource for customer ${customerId}`);
        return dataSource;
      }

      this.logger.warn(
        `DataSource for customer ${customerId} found but not initialized. Attempting to reinitialize.`,
      );
      try {
        await dataSource.initialize();
        this.logger.log(
          `DataSource for customer ${customerId} reinitialized successfully.`,
        );
        return dataSource;
      } catch (error) {
        this.logger.error(
          `Failed to reinitialize DataSource for customer ${customerId}: ${error.message}`,
        );
        this.dataSources.delete(customerId); //% Eliminar del caché si falló la re-inicialización
        throw new InternalServerErrorException(
          `Could not reconnect to tenant database.`,
        );
      }
    }

    //% Si no está en caché, obtener la información de conexión de la master DB
    this.logger.log(`Creating new DataSource for customer ${customerId}`);
    const customer = await this.customerService.findOne(customerId);
    if (!customer) {
      this.logger.error(
        `Customer with ID ${customerId} not found in master database.`,
      );
      throw new NotFoundException(`Customer not found.`);
    }

    //% Construir las opciones de typeorm datasource para el tenant
    const tenantOptions: DataSourceOptions = {
      ...tenantDbConfigTemplate,
      url: customer.db_connection_string,
      name: customerId,
      //TODO ... Asegúrate de que todas tus entidades tambien estén listadas aquí
      entities: [
        //? Entidades Flor
        Order,
        OrderDetail,
        MembershipType,
        Membership,
        Cancellation,
        CompanySubscription,
        GlobalMembershipType,

        //? Entidades Steven
        Brand,
        Category,
        SubCategory,
        Product,
        ProductVariant,
        MembershipStatus,
        Size,
        CancellationReason,
        VariantSize,
        Color,
        // Notification,

        //? Entidades Pia
        Audit,
        Cut,
        Shipment,
        ShipmentSize,
        ShipmentVariant,

        //? Entidades Ebgueny
        User,
        Employee,
        Client,
        Role,
        Todo,
        Customer,
      ],
      synchronize: false,
      // process.env.NODE_ENV !== 'production' &&
      // process.env.ENABLE_TENANT_SYNC === 'true',
    };

    //% Crear e inicializar la nueva instancia de DataSource
    const newDataSource = new DataSource(tenantOptions);

    try {
      await newDataSource.initialize();
      this.dataSources.set(customerId, newDataSource); //% Cachear la nueva conexión
      this.logger.log(
        `New DataSource created and initialized for customer ${customerId}.`,
      );
      return newDataSource;
    } catch (error) {
      this.logger.error(
        `Failed to initialize new DataSource for customer ${customerId} using connection string: ${customer.db_connection_string}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Could not connect to tenant database. Please check connection string or database status.`,
      );
    }
  }

  /*
    & Obtiene la conexión a la base de datos del tenant actual desde el contexto
    & este método será usado por los repositorios inyectados para obtener la conexión correcta
    & @returns La instancia de TypeORM DataSource para el tenant actual
    & @throws InternalServerErrorException si el contexto del tenant no está configurado o la conexión no está inicializada
   */
  getTenantDataSourceFromContext(): DataSource {
    const context = getTenantContext();
    if (!context || !context.customerId || !context.tenantDataSource) {
      this.logger.error(
        'Attempted to get tenant DataSource from context, but context is not fully set or invalid.',
      );
      throw new InternalServerErrorException(
        'Tenant context not set. Cannot get tenant data source.',
      );
    }
    //% Verifica que la DataSource del contexto esté inicializada
    if (!context.tenantDataSource.isInitialized) {
      this.logger.error(
        `Tenant DataSource for ${context.customerId} found in context but is not initialized.`,
      );
      throw new InternalServerErrorException(
        `Tenant DataSource for current request is not initialized.`,
      );
    }
    return context.tenantDataSource;
  }

  /*
    & cierra todas las conexiones de bases de datos de tenants cuando la aplicación se cierra.
    & esto es crucial para liberar recursos de la base de datos.
   */
  async onModuleDestroy() {
    this.logger.log('Closing all cached tenant DataSources...');
    for (const [customerId, dataSource] of this.dataSources.entries()) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        this.logger.log(`DataSource for customer ${customerId} destroyed.`);
      } else {
        this.logger.warn(
          `DataSource for customer ${customerId} was not initialized, skipping destroy.`,
        );
      }
    }
    this.dataSources.clear();
    this.logger.log('All tenant DataSources closed.');
  }
}
