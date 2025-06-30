import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Not, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { instanceToPlain } from 'class-transformer';
import { ProductVariant } from '../productsVariant/entities/product-variant.entity';
import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';
import { ProductVariantService } from '../productsVariant/product-variant.service';
import { Color } from 'src/catalogues/colorProduct/entities/colorProduct.entity';
import { DataSource } from 'typeorm';
import { Category } from 'src/catalogues/category/entities/category.entity';
import { SubCategory } from 'src/catalogues/subCategory/entities/sub-category.entity';
import { Brand } from 'src/catalogues/brand/entities/brand.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';
import { Size } from 'src/catalogues/sizeProduct/entities/size-product.entity';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';
import { slugify } from '../../utils/slugify'; //NACHO

@Injectable()
export class ProductService {
  constructor(
    @InjectTenantRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectTenantRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectTenantRepository(Color)
    private readonly colorRepository: Repository<Color>,
    @InjectTenantRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
    private readonly variantService: ProductVariantService,
    private readonly dataSource: DataSource,
  ) {}

  async saveMany(data: CreateProductDto[]) {
    return this.productRepository.save(data);
  }

  async create(createDto: CreateProductDto, userId: string): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { variants, ...productData } = createDto;

      delete (productData as any).employee_id;

      const employee = await queryRunner.manager.findOne(Employee, {
      where: { user: { id: userId } },
      relations: ['user'], // para que funcione correctamente
    });

    if (!employee) {
      throw new NotFoundException('No employee found for this user');
    }

      const existing = await queryRunner.manager.findOne(Product, {
        where: [{ code: productData.code }, { name: productData.name }],
      });

      if (existing) {
        throw new BadRequestException(
          `Product already exists with ${
            existing.code === productData.code ? 'code' : 'name'
          }: ${existing.code === productData.code ? productData.code : productData.name}`,
        );
      }

      const category = await queryRunner.manager.findOneBy(Category, {
        id: productData.category_id,
      });
      const subCategory = await queryRunner.manager.findOneBy(SubCategory, {
        id: productData.sub_category_id,
      });
      const brand = await queryRunner.manager.findOneBy(Brand, {
        id: productData.brand_id,
      });

      if (!category || !subCategory || !brand) {
        throw new NotFoundException(
          `Invalid foreign key: ${[
            !category && 'category',
            !subCategory && 'subCategory',
            !brand && 'brand',
          ]
            .filter(Boolean)
            .join(', ')}`,
        );
      }

      let slug = slugify(productData.name); // NACHO
      const slugExists = await queryRunner.manager.findOne(Product, {
        where: { slug },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }

      const product = queryRunner.manager.create(Product, {
        ...productData,
        slug, // NACHO
        employee,
      });
      const savedProduct = await queryRunner.manager.save(product);

      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const color = await queryRunner.manager.findOneBy(Color, {
            id: variant.color_id,
          });
          if (!color) {
            throw new NotFoundException(
              `Color with id ${variant.color_id} not found`,
            );
          }

          const createdVariant = queryRunner.manager.create(ProductVariant, {
            ...variant,
            product: savedProduct,
            color,
          });

          const savedVariant = await queryRunner.manager.save(createdVariant);

          for (const vs of variant.variantSizes || []) {
            const size = await queryRunner.manager.findOneBy(Size, {
              id: vs.size_id,
            });
            if (!size) {
              throw new NotFoundException(
                `Size with id ${vs.size_id} not found`,
              );
            }

            if (vs.stock <= 0 || vs.stock > 10000) {
              throw new BadRequestException(
                'Stock must be between 1 and 10,000 units',
              );
            }

            const variantSize = queryRunner.manager.create(VariantSize, {
              size,
              stock: vs.stock,
              variantProduct: savedVariant,
            });

            await queryRunner.manager.save(variantSize);
          }
        }
      }

      await queryRunner.commitTransaction();

      const productWithVariants = await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['variants', 'variants.color', 'variants.variantSizes.size'],
      });

      return instanceToPlain(productWithVariants);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === '23503') {
        const mensaje =
          error.detail
            ?.match(/\((.*?)\)=\((.*?)\)/)
            ?.slice(1)
            .join(': ') ?? 'Foreign key constraint violation';
        throw new BadRequestException(`Invalid foreign key - ${mensaje}`);
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<any> {
    const products = await this.productRepository.find({
      relations: [
        'category',
        'subCategory',
        'brand',
        'variants.color',
        'variants.variantSizes.size',
      ],
    });
    return instanceToPlain(products);
  }

  async findOne(id: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'subCategory',
        'brand',
        'variants.color',
        'variants.variantSizes.size',
      ],
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return instanceToPlain(product);
  }

  async update(
    id: string,
    updateDto: UpdateProductDto,
  ): Promise<{ message: string; updatedProduct: Product }> {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    if (updateDto.name && updateDto.name !== product.name) {
      const nameExists = await this.productRepository.findOne({
        where: { name: updateDto.name },
      });

      if (nameExists && nameExists.id !== id) {
        throw new BadRequestException(
          `Product name "${updateDto.name}" already exists`,
        );
      }

      updateDto.slug = slugify(updateDto.name);
    }

    if (updateDto.code && updateDto.code !== product.code) {
      const codeExists = await this.productRepository.findOne({
        where: { code: updateDto.code },
      });

      if (codeExists && codeExists.id !== id) {
        throw new BadRequestException(
          `Product code "${updateDto.code}" already exists`,
        );
      }
    }

    const updatedProduct = await this.productRepository.save({
      ...product,
      ...updateDto,
    });

    return {
      message: `Product with id ${id} updated successfully`,
      updatedProduct,
    };
  }

  async delete(id: string): Promise<{ message: string }> {
    const exists = await this.productRepository.findOneBy({ id });
    if (!exists) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.productRepository.update(id, { deleted_at: new Date() });
    return { message: `Product with ID ${id} deleted successfully` };
  }

  async findManyVariantsByIds(ids: string[]): Promise<ProductVariant[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.productVariantRepository.find({
      where: {
        id: In(ids),
      },
      relations: {
        product: true,
      },
    });
  }

  // NACHO
  async findByCategoryAndSubcategorySlugs(
    categorySlug: string,
    subCategorySlug: string,
  ): Promise<any> {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { slug: subCategorySlug },
      relations: ['categories'],
    });

    if (!subCategory) {
      throw new NotFoundException(
        `Subcategoría ${subCategorySlug} no encontrada`,
      );
    }

    const belongsToCategory = subCategory.categories.some(
      (cat) => cat.slug === categorySlug,
    );

    if (!belongsToCategory) {
      throw new BadRequestException(
        'Esa subcategoría no pertenece a la categoría indicada',
      );
    }

    const products = await this.productRepository.find({
      where: {
        subCategory: { id: subCategory.id },
      },
      relations: [
        'variants',
        'variants.color',
        'variants.variantSizes',
        'variants.variantSizes.size',
        'subCategory',
        'category',
        'brand',
      ],
    });

    return instanceToPlain(products);
  }
}
