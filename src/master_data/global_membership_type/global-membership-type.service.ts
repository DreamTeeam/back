import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalMembershipType } from './entities/global-membership-type.entity';
import { CreateGlobalMembershipTypeDto } from './dto/create-global-membership-type.dto';
import { UpdateGlobalMembershipTypeDto } from './dto/update-global-membership-type.dto';

@Injectable()
export class GlobalMembershipTypeService {
  constructor(
    @InjectRepository(GlobalMembershipType, 'masterConnection') //! Especificar la conexión
    private globalMembershipTypeRepository: Repository<GlobalMembershipType>,
  ) {}

  async create(
    createDto: CreateGlobalMembershipTypeDto,
  ): Promise<GlobalMembershipType> {
    const newType = this.globalMembershipTypeRepository.create(createDto);
    return this.globalMembershipTypeRepository.save(newType);
  }

  findAll(): Promise<GlobalMembershipType[]> {
    return this.globalMembershipTypeRepository.find();
  }

  async findOne(id: string): Promise<GlobalMembershipType> {
    const type = await this.globalMembershipTypeRepository.findOne({
      where: { id },
    });
    if (!type) {
      throw new NotFoundException(
        `Global Membership Type with ID "${id}" not found`,
      );
    }
    return type;
  }

  async update(
    id: string,
    updateDto: UpdateGlobalMembershipTypeDto,
  ): Promise<GlobalMembershipType | null> {
    const type = await this.findOne(id);
    await this.globalMembershipTypeRepository.update(id, updateDto);
    return this.globalMembershipTypeRepository.findOne({ where: { id } }); 
  }

  async remove(id: string): Promise<void> {
    const result = await this.globalMembershipTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Global Membership Type with ID "${id}" not found`,
      );
    }
  }
}
