import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentVariant } from './entities/shipment-variant.entity';
import { ShipmentSize } from './entities/shipment-size.entity';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsCsvService } from './csv/shipments-csv.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, ShipmentVariant, ShipmentSize])],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsCsvService],
})
export class ShipmentsModule {}
