import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
//import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { TenantConnectionService } from 'src/common/tenant-connection/tenant-connection.service';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';
import { slugify } from '../../utils/slugify'; //NACHO

@Injectable()
export class CategoryService {
  constructor(
    @InjectTenantRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createDto: CreateCategoryDto): Promise<any> {
    const { name } = createDto;
    const key = slugify(name); //NACHO
    const slug = slugify(name); //NACHO


    const existing = await this.categoryRepository.findOne({
      where: [{ name }, { key }],
    });

    if (existing) {
      throw new BadRequestException(
        `Category already exists with ${
          existing.name === name ? 'name' : 'key'
        }: ${existing.name === name ? name : key}`,
      );
    }
    const category = this.categoryRepository.create({
      ...createDto,
      key, // NACHO
      slug, // NACHO
    });
    const saved = await this.categoryRepository.save(category);
    return instanceToPlain(saved);
  }

  async findAll(): Promise<any> {
    const categories = await this.categoryRepository.find({
      relations: {
        subcategories: true,
      },
    });
    return instanceToPlain(categories);
  }

  async findOne(id: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        subcategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return instanceToPlain(category);
  }

  async update(
    id: string,
    updateDto: UpdateCategoryDto,
  ): Promise<{ message: string }> {
    const exists = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!exists)
      throw new NotFoundException(`Category with id ${id} not found`);
    await this.categoryRepository.update(id, updateDto);
    return { message: `Category with id ${id} updated successfully` };
  }

  async delete(id: string): Promise<{ message: string }> {
    const exists = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!exists)
      throw new NotFoundException(`Category with id ${id} not found`);
    await this.categoryRepository.softDelete(id);
    return { message: `Category with id ${id} deactivated successfully` };
  }

  // NACHO
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['subcategories'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }
}
