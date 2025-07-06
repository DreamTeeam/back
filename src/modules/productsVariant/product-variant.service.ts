import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Size } from '../../catalogues/sizeProduct/entities/size-product.entity';
import { Product } from '../products/entities/product.entity';
import { instanceToPlain } from 'class-transformer';
import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';
import { Color } from 'src/catalogues/colorProduct/entities/colorProduct.entity';
import { VariantSizesService } from '../variantSIzes/variant-sizes.service';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectTenantRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectTenantRepository(Color)
    private readonly colorRepository: Repository<Color>,
    @InjectTenantRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectTenantRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectTenantRepository(VariantSize)
    private readonly variantSizeRepository: Repository<VariantSize>,
    private readonly variantSizeService: VariantSizesService,
  ) {}

  async create(
    createDto: CreateProductVariantDto,
    productArg?: Product,
    manager?: EntityManager,
  ): Promise<any> {
    const { variantSizes = [], color_id, product_id, ...rest } = createDto;

    const product = productArg
      ? productArg
      : product_id
        ? manager
          ? await manager.findOneBy(Product, { id: product_id })
          : await this.productRepository.findOneBy({ id: product_id })
        : null;

    if (!product)
      throw new NotFoundException(`Product with id ${product_id} not found`);

    const color = manager
      ? await manager.findOneBy(Color, { id: color_id })
      : await this.colorRepository.findOneBy({ id: color_id });
    if (!color)
      throw new NotFoundException(`Color with id ${color_id} not found`);

    const variant = manager
      ? manager.create(ProductVariant, { ...rest, product, color })
      : this.variantRepository.create({ ...rest, product, color });

    const savedVariant = manager
      ? await manager.save(variant)
      : await this.variantRepository.save(variant);

    if (variantSizes.length > 0) {
      for (const sizeDto of variantSizes) {
        await this.variantSizeService.create(sizeDto, savedVariant, manager);
      }
    }

    const fullVariant = manager
      ? await manager.findOne(ProductVariant, {
          where: { id: savedVariant.id },
          relations: ['product', 'color', 'variantSizes', 'variantSizes.size'],
        })
      : await this.variantRepository.findOne({
          where: { id: savedVariant.id },
          relations: ['product', 'color', 'variantSizes', 'variantSizes.size'],
        });

    return instanceToPlain(fullVariant);
  }

  async findAll(): Promise<any> {
    const productVariants = await this.variantRepository.find({
      relations: ['color', 'variantSizes', 'product'],
    });
    return instanceToPlain(productVariants);
  }

  async findOne(id: string): Promise<any> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['color', 'variantSizes', 'product'],
    });
    if (!variant)
      throw new NotFoundException(`Variant with ID ${id} not found`);
    return instanceToPlain(variant);
  }

  async update(
    id: string,
    updateDto: UpdateProductVariantDto,
  ): Promise<{ message: string }> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product', 'color'],
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    const { color_id, product_id, variantSizes, ...rest } = updateDto;

    let product = variant.product;
    if (product_id && product_id !== variant.product.id) {
      const foundProduct = await this.productRepository.findOneBy({
        id: product_id,
      });
      if (!foundProduct) {
        throw new NotFoundException(`Product with ID ${product_id} not found`);
      }
      product = foundProduct;
    }

    let color = variant.color;
    if (color_id && color_id !== variant.color.id) {
      const foundColor = await this.colorRepository.findOneBy({ id: color_id });
      if (!foundColor) {
        throw new NotFoundException(`Color with ID ${color_id} not found`);
      }
      color = foundColor;
    }

    const updated = this.variantRepository.create({
      ...variant,
      ...rest,
      product,
      color,
    });

    await this.variantRepository.save(updated);

    return {
      message: `Variant with ID ${id} updated successfully`,
    };
  }

  async delete(id: string): Promise<{ message: string }> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['variantSizes'],
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    await Promise.all(
      variant.variantSizes.map((vs) => this.variantSizeService.remove(vs.id)),
    );
    await this.variantRepository.update(id, { deleted_at: new Date() });

    return { message: `Variant with ID ${id} deleted successfully` };
  }
}
