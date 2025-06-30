import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
//import { InjectRepository } from '@nestjs/typeorm';
import { Size } from './entities/size-product.entity';
import { Repository, DataSource } from 'typeorm';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { instanceToPlain } from 'class-transformer';
import { TenantConnectionService } from 'src/common/tenant-connection/tenant-connection.service';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class SizeService {
  constructor(
    @InjectTenantRepository(Size)
    private readonly sizeRepository: Repository<Size>,
  ) {}

  async create(createDto: CreateSizeDto): Promise<any> {
    const existing = await this.sizeRepository.findOne({
      where: {
        size_us: createDto.size_us,
        size_eur: createDto.size_eur,
        size_cm: createDto.size_cm,
      },
    });

    if (existing) {
      throw new BadRequestException(`This size already exists`);
    }

    const size = this.sizeRepository.create(createDto);
    const saved = await this.sizeRepository.save(size);
    return instanceToPlain(saved);
  }

  async findAll(): Promise<any> {
    const sizes = await this.sizeRepository.find();
    return instanceToPlain(sizes);
  }

  async findOne(id: string): Promise<any> {
    const size = await this.sizeRepository.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }
    return instanceToPlain(size);
  }

  async update(id: string, updateDto: UpdateSizeDto): Promise<any> {
    const size = await this.sizeRepository.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }

    const existing = await this.sizeRepository.findOne({
      where: {
        size_us: updateDto.size_us,
        size_eur: updateDto.size_eur,
        size_cm: updateDto.size_cm,
      },
    });

    if (existing) {
      throw new BadRequestException(`This size already exists`);
    }

    await this.sizeRepository.update(id, updateDto);
    return { message: `Size with id ${id} updated successfully` };
  }

  async remove(id: string): Promise<any> {
    const size = await this.sizeRepository.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }

    await this.sizeRepository.softDelete(id);
    return { message: `Size with id ${id} deleted successfully` };
  }
}
