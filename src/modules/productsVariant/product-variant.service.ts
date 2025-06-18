import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Size } from '../sizeProduct/entities/size-product.entity';
import { Product } from '../products/entities/product.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createDto: CreateProductVariantDto): Promise<any> {
    const { size_id, product_id } = createDto;

    const size = await this.sizeRepository.findOne({ where: { id: size_id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${size_id} not found`);
    }

    const product = await this.productRepository.findOne({
      where: { id: product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${product_id} not found`);
    }

    const variant = this.variantRepository.create(createDto);
    const saved = await this.variantRepository.save(variant);
    return instanceToPlain(saved);
  }

  async findAll(): Promise<any> {
    const productVariants = await this.variantRepository.find({
      relations: ['product', 'size'],
    });
    return instanceToPlain(productVariants);
  }

  async findOne(id: string): Promise<any> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product', 'size'],
    });
    if (!variant)
      throw new NotFoundException(`Variant with ID ${id} not found`);
    return instanceToPlain(variant);
  }

  async update(
    id: string,
    updateDto: UpdateProductVariantDto,
  ): Promise<{ message: string }> {
    const exists = await this.variantRepository.findOneBy({ id });
    if (!exists) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }
    await this.variantRepository.update(id, {
      ...updateDto,
    });
    return { message: `Variant with ID ${id} updated successfully` };
  }

  async delete(id: string): Promise<{ message: string }> {
    const exists = await this.variantRepository.findOneBy({ id });
    if (!exists) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }
    await this.variantRepository.update(id, { deleted_at: new Date() });
    return { message: `Variant with ID ${id} deleted successfully` };
  }
}
