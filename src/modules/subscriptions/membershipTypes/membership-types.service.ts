import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipType } from './entities/membershipType.entity';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';

@Injectable()
export class MembershipTypesService {
  constructor(
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
  ) {}

  create(createMembershipTypeDto: CreateMembershipTypeDto) {
    return this.membershipTypeRepository.create(createMembershipTypeDto);
  }

  findAll(): Promise<MembershipType[]> {
    return this.membershipTypeRepository.find();
  }

  async findOne(id: string): Promise<MembershipType> {
    const type = await this.membershipTypeRepository.findOneBy({ id });
    if (!type) {
      throw new NotFoundException(
        `MembershipType con ID "${id}" no encontrado.`,
      );
    }
    return type;
  }

  async update(
    id: string,
    updateMembershipTypeDto: UpdateMembershipTypeDto,
  ): Promise<MembershipType> {
    const type = await this.membershipTypeRepository.preload({
      id,
      ...updateMembershipTypeDto,
    });
    if (!type) {
      throw new NotFoundException(
        `MembershipType con ID "${id}" no encontrado.`,
      );
    }
    return this.membershipTypeRepository.save(type);
  }

  async remove(id: string): Promise<{ message: string }> {
    const type = await this.findOne(id);
    await this.membershipTypeRepository.remove(type);
    return { message: `MembershipType con ID "${id}" eliminado.` };
  }
}
