import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { instanceToPlain } from 'class-transformer';
import { ProductVariant } from '../productsVariant/entities/product-variant.entity';
import { Size } from '../sizeProduct/entities/size-product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
  ) {}

  async saveMany(data: CreateProductDto[]) {
    return this.productRepository.save(data);
  }

  async create(createDto: CreateProductDto): Promise<any> {
    const { variants, ...productData } = createDto;

    const exist = await this.productRepository.findOne({
      where: { code: productData.code },
    });
    if (exist) {
      throw new BadRequestException(
        `Product with code ${createDto.code} alredy exists`,
      );
    }
    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

    if (variants && variants.length > 0) {
      const preparedVariants = await Promise.all(
        variants.map(async (variant) => {
          const size = await this.sizeRepository.findOne({
            where: { id: variant.size_id },
          });

          if (!size) {
            throw new NotFoundException(
              `Size with id ${variant.size_id} not found`,
            );
          }

          return this.variantRepository.create({
            ...variant,
            product: savedProduct,
            size,
          });
        }),
      );

      await this.variantRepository.save(preparedVariants);
    }

    const productWithVariants = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['variants'],
    });

    return instanceToPlain(productWithVariants);
  }

  async findAll(): Promise<any> {
    const products = await this.productRepository.find({
      relations: ['category', 'subCategory', 'brand'],
    });
    return instanceToPlain(products);
  }

  async findOne(id: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'subCategory', 'brand'],
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

    return this.variantRepository.find({
      where: {
        id: In(ids),
      },
      relations: {
        product: true,
      },
    });
  }
}
