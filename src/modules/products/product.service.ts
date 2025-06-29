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
import { slugify } from '../../utils/slugify'; //NACHOimport { slugify } from '../../utils/slugify'; //NACHO

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
    private readonly subCategoryRepository: Repository<SubCategory>, // NACHO
    @InjectTenantRepository(SubCategory)
    private readonly variantService: ProductVariantService,
    private readonly dataSource: DataSource,
  ) {}

  async saveMany(data: CreateProductDto[]) {
    return this.productRepository.save(data);
  }

  async create(createDto: CreateProductDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { variants, ...productData } = createDto;

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
      // const employee = await queryRunner.manager.findOneBy(Employee, {
      //   id: productData.employee_id,
      // });

      if (!category || !subCategory || !brand) {
        throw new NotFoundException(
          `Invalid foreign key: ${[
            !category && 'category',
            !subCategory && 'subCategory',
            !brand && 'brand',
            // !employee && 'employee',
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

            if (vs.stock <= 0) {
              throw new BadRequestException('Stock must be greater than 0');
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
    productData: UpdateProductDto,
  ): Promise<{ message: string; updatedProduct: Product }> {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const existing = await this.productRepository.findOne({
      where: [{ code: productData.code }, { name: productData.name }],
    });

    if (existing) {
      throw new BadRequestException(
        `Product already exists with ${
          existing.code === productData.code ? 'code' : 'name'
        }: ${existing.code === productData.code ? productData.code : productData.name}`,
      );
    }

    const updatedProduct = await this.productRepository.save({
      ...product,
      ...productData,
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
