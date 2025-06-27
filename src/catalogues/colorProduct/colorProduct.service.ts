import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Color } from './entities/colorProduct.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { instanceToPlain } from 'class-transformer';
import { TenantConnectionService } from 'src/common/tenant-connection/tenant-connection.service';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class ColorService {
  constructor(
    @InjectTenantRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async create(createDto: CreateColorDto) {
    const exists = await this.colorRepository.findOne({
      where: [{ color: createDto.color }, { hexCode: createDto.hexCode }],
    });

    if (exists) {
      const conflictField =
        exists.color === createDto.color ? 'color' : 'hexCode';
      const conflictValue =
        conflictField === 'color' ? createDto.color : createDto.hexCode;

      throw new BadRequestException(
        `Color already exists with ${conflictField}: ${conflictValue}`,
      );
    }

    const color = this.colorRepository.create(createDto);
    const saved = await this.colorRepository.save(color);
    return instanceToPlain(saved);
  }

  async findAll() {
    const data = await this.colorRepository.find();
    return instanceToPlain(data);
  }

  async findOne(id: string) {
    const color = await this.colorRepository.findOne({ where: { id } });
    if (!color) throw new NotFoundException(`Color with id ${id} not found`);
    return instanceToPlain(color);
  }

 async update(id: string, updateDto: UpdateColorDto) {
  const color = await this.colorRepository.findOneBy({ id });
  if (!color) {
    throw new NotFoundException(`Color with id ${id} not found`);
  }

  if (updateDto.color || updateDto.hexCode) {
    const duplicate = await this.colorRepository.findOne({
      where: [
        { color: updateDto.color ?? '', id: Not(id) },
        { hexCode: updateDto.hexCode ?? '', id: Not(id) },
      ],
    });

    if (duplicate) {
      const conflictField =
        duplicate.color === updateDto.color ? 'color' : 'hexCode';
      const conflictValue =
        conflictField === 'color' ? updateDto.color : updateDto.hexCode;

      throw new BadRequestException(
        `Color already exists with ${conflictField}: ${conflictValue}`,
      );
    }
  }

  const updated = this.colorRepository.merge(color, updateDto);
  const saved = await this.colorRepository.save(updated);
  return instanceToPlain(saved);
}

  async remove(id: string) {
    const color = await this.colorRepository.findOneBy({ id });
    if (!color) throw new NotFoundException(`Color with id ${id} not found`);
    await this.colorRepository.update(id, { deleted_at: new Date() });
    return { message: `Color with id ${id} deleted successfully` };
  }
}
