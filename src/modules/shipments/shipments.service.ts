import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dtos/create-shipment.dto';
import { UpdateShipmentDto } from './dtos/update-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
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

  async findOne(id: string) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
      relations: ['variants', 'variants.sizes'],
    });

    if (!shipment) {
      throw new NotFoundException(`Embarque con ID ${id} no encontrado`);
    }

    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto) {
    const shipment = await this.shipmentRepo.preload({ id, ...dto });

    if (!shipment) {
      throw new NotFoundException(`Embarque con ID ${id} no encontrado`);
    }

    return this.shipmentRepo.save(shipment);
  }

  async remove(id: string) {
    const shipment = await this.shipmentRepo.findOneBy({ id });

    if (!shipment) {
      throw new NotFoundException(`Embarque con ID ${id} no encontrado`);
    }

    return this.shipmentRepo.softDelete(shipment); //* cambiado por softdelete
  }
}
