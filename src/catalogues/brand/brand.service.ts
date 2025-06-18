import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { SubCategory } from '../subCategory/entities/sub-category.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand) private readonly brandRepository: Repository<Brand>,
    @InjectRepository(SubCategory)
  private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

 async create(createDto: CreateBrandDto): Promise<any> {
    const { name, key, subcategories } = createDto;

    const existing = await this.brandRepository.findOne({
      where: [{ name }, { key }],
    });

    if (existing) {
      throw new BadRequestException(
        `Brand already exists with ${
          existing.name === name ? 'name' : 'key'
        }: ${existing.name === name ? name : key}`,
      );
    }

      const duplicateSubCategoryIds = subcategories.filter(
    (id, i, arr) => arr.indexOf(id) !== i,
  );
  if (duplicateSubCategoryIds.length) {
    throw new BadRequestException(`Duplicated SubCategory IDs`);
  }

  const existingSubCategories = await this.subCategoryRepository.find({
    where: { id: In(subcategories) },
  });

  if (existingSubCategories.length !== subcategories.length) {
    const missing = subcategories.filter(
      (id) => !existingSubCategories.find((sc) => sc.id === id),
    );
    throw new NotFoundException(
      `SubCategories not found: ${missing.join(', ')}`,
    );
  }

    const brand = this.brandRepository.create({
    ...createDto,
    subcategories: existingSubCategories,
  });
    const saved = await this.brandRepository.save(brand);
    return instanceToPlain(saved);
  }

  async findAll(): Promise<any> {
    const brands = await this.brandRepository.find({
      relations: {
        subcategories: true,
      },
    });
    return instanceToPlain(brands);
  }

  async findOne(id: string): Promise<any> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: {
        subcategories: true,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }

    return instanceToPlain(brand);
  }


  async update(
    id: string,
    updateDto: UpdateBrandDto,
  ): Promise<{ message: string }> {
    const exists = await this.brandRepository.findOne({
      where: { id },
    });
    if (!exists) throw new NotFoundException(`Brand with id ${id} not found`);
    await this.brandRepository.update(id, updateDto);
    return { message: `Brand with id ${id} updated successfully` };
  }

  async delete(id: string): Promise<{ message: string }> {
    const exists = await this.brandRepository.findOne({
      where: { id },
    });
    if (!exists) throw new NotFoundException(`Brand with id ${id} not found`);
    await this.brandRepository.softDelete(id);
    return { message: `Brand with id ${id} deactivated successfully` };
  }
}
