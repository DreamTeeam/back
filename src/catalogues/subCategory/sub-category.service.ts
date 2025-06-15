import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { SubCategory } from './entities/sub-category.entity';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async create(createDto: CreateSubCategoryDto): Promise<any> {
    const existing = await this.subCategoryRepository.findOne({
      where: [{ name: createDto.name }, { key: createDto.key }],
    });

    if (existing) {
      throw new BadRequestException(
        `Subcategory alredy exist with ${
          existing.name === createDto.name ? 'name' : 'key'
        }: ${existing.name === createDto.name ? createDto.name : createDto.key}`,
      );
    }

    const { categories } = createDto;

    const duplicateCategoryIds = categories.filter(
      (id, i, arr) => arr.indexOf(id) !== i,
    );
    
    if (duplicateCategoryIds.length) {
      throw new BadRequestException(
        `IDs duplicated: ${duplicateCategoryIds.length ? 'categories' : ''}`,
      );
    }

    const existingCategories = await this.categoryRepository.find({
      where: { id: In(categories) },
    });

    if (existingCategories.length !== categories.length) {
      const missing = categories.filter(
        (id) => !existingCategories.find((c) => c.id === id),
      );
      throw new NotFoundException(
        `categories not found: ${missing.join(', ')}`,
      );
    }

    const subCategory = this.subCategoryRepository.create({
      ...createDto,
      categories: existingCategories,
    });
    const saved = await this.subCategoryRepository.save(subCategory);
    return instanceToPlain(saved);
  }

  async findAll(): Promise<any> {
    const subCategories = await this.subCategoryRepository.find({
      relations: {
        categories: true,
        brands: true,
      },
    });
    return instanceToPlain(subCategories);
  }

  async findOne(id: string): Promise<any> {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
      relations: {
        categories: true,
        brands: true,
      },
    });

    if (!subCategory) {
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    }

    return instanceToPlain(subCategory);
  }

  async update(
    id: string,
    updateDto: UpdateSubCategoryDto,
  ): Promise<{ message: string }> {
    const exists = await this.subCategoryRepository.findOneBy({ id });
    if (!exists)
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    await this.subCategoryRepository.update(id, updateDto);
    return { message: `SubCategory with id ${id} updated successfully` };
  }

  async delete(id: string): Promise<{ message: string }> {
    const exists = await this.subCategoryRepository.findOne({ where: { id } });
    if (!exists)
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    await this.subCategoryRepository.softDelete(id);
    return { message: `SubCategory with id ${id} deleted successfully` };
  }
}
