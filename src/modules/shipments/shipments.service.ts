import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dtos/create-shipment.dto';
import { UpdateShipmentDto } from './dtos/update-shipment.dto';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator'; 

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectTenantRepository(Shipment)
    private shipmentRepo: Repository<Shipment>,
  ) {}

  async create(dto: CreateShipmentDto) {
    const shipment = this.shipmentRepo.create(dto);
    return this.shipmentRepo.save(shipment);
  }

  async findAll() {
    return this.shipmentRepo.find({
      relations: ['variants', 'variants.sizes'],
    });
  }

  async findOne(id: number) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
      relations: ['variants', 'variants.sizes'],
    });

    if (!shipment) {
      throw new NotFoundException(`Embarque con ID ${id} no encontrado`);
    }

    return shipment;
  }

  async update(id: number, dto: UpdateShipmentDto) {
    const shipment = await this.shipmentRepo.preload({ id, ...dto });

    if (!shipment) {
      throw new NotFoundException(`Embarque con ID ${id} no encontrado`);
    }

    return this.shipmentRepo.save(shipment);
  }

  async remove(id: number) {
    const shipment = await this.shipmentRepo.findOneBy({ id });

    if (!shipment) {
      throw new NotFoundException(`Embarque con ID ${id} no encontrado`);
    }

    return this.shipmentRepo.softRemove(shipment);
  }
}



