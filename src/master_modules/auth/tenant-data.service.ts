// src/master_modules/auth/tenant-data.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
//TODO LATER: Cuando definamos las entidades del tenant, las importaremos aquí.
// LATER: Cuando definamos las entidades del tenant, las importaremos aquí.
// import { Role } from '../../tenant_modules/roles/entities/role.entity';

@Injectable()
export class TenantDataService {
  private readonly logger = new Logger(TenantDataService.name);

  /**
   * Connects to a specific tenant's database to retrieve the
   * specific roles of an employee.
   * @param userId The global ID of the user.
   * @param tenant The Tenant entity containing the connection string.
   * @returns An array of role names (e.g., ['CASHIER', 'ADMIN']).
   */
  async getEmployeeRoles(userId: string, tenant: Tenant): Promise<string[]> {
    let tenantDataSource: DataSource | null = null;
    try {
      // Create a new data source on the fly using the tenant's connection string
      tenantDataSource = new DataSource({
        type: 'postgres',
        url: tenant.db_connection_string,
        entities: [
          //TODO LATER: Add tenant-specific entities like Role here */
          /* LATER: Add tenant-specific entities like Role here */
        ],
        synchronize: false, // NEVER use synchronize: true in production logic
      });

      await tenantDataSource.initialize();

      // This is an example query. We will need to adjust it once we have the
      // final tenant-side entities defined. For now, we assume a setup similar
      // to the original one. The key is to use the GLOBAL userId.
      const roles = await tenantDataSource.query(
        `
          SELECT r.name FROM roles r
          INNER JOIN employee_roles er ON r.id = er.role_id
          WHERE er.employee_user_id = $1
      `,
        [userId],
      );

      // IMPORTANT: Always destroy the connection when done.
      await tenantDataSource.destroy();

      return roles.map((r) => r.name);
    } catch (error) {
      this.logger.error(
        `Failed to connect or fetch roles from tenant ${tenant.slug}`,
        error.stack,
      );

      // Ensure connection is destroyed even if an error occurs
      if (tenantDataSource?.isInitialized) {
        await tenantDataSource.destroy();
      }

      throw new InternalServerErrorException(
        'Could not retrieve tenant-specific roles.',
      );
    }
  }
}
