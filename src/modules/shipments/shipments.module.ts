import { Module } from '@nestjs/common';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';
import { Shipment } from './entities/shipment.entity';
import { ShipmentVariant } from './entities/shioment-variant.entity';
import { ShipmentSize } from './entities/shipment-size.entity';

import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsCsvService } from './csv/shipments-csv.service'; 

@Module({
  imports: [
    TenantTypeOrmModule.forFeature([Shipment, ShipmentVariant, ShipmentSize]),
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsCsvService],
})
export class ShipmentsModule {}
