import { Module, Global } from '@nestjs/common';
import { TenantConnectionService } from './tenant-connection.service';
import { CustomerModule } from '../../master_data/customer/customer.module'; //! Necesita CustomerService del módulo MasterData

@Global() //! Hace que TenantConnectionService esté disponible globalmente sin necesidad de importar en cada módulo
@Module({
  imports: [CustomerModule], //! Importa CustomerModule para poder inyectar CustomerService
  providers: [TenantConnectionService],
  exports: [TenantConnectionService], //! Exporta el servicio para que pueda ser inyectado donde sea necesario
})
export class TenantConnectionModule {}
