import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { VariantSize } from './entities/variantSizes.entity';
import { CreateVariantSizeDto } from './dto/create-variant-sizes.dto';
import { UpdateVariantSizeDto } from './dto/update-variant-sizes.dto';
import { Size } from 'src/catalogues/sizeProduct/entities/size-product.entity';
import { ProductVariant } from 'src/modules/productsVariant/entities/product-variant.entity';
import { instanceToPlain } from 'class-transformer';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class VariantSizesService {
  constructor(
    @InjectTenantRepository(VariantSize)
    private readonly variantSizeRepository: Repository<VariantSize>,
    @InjectTenantRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectTenantRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  async create(
    createDto: CreateVariantSizeDto,
    variantProductFromArgs?: ProductVariant,
    manager?: EntityManager,
  ): Promise<any> {
    const { size_id, stock, variant_product_id } = createDto;

    const size = manager
      ? await manager.findOneBy(Size, { id: size_id })
      : await this.sizeRepository.findOneBy({ id: size_id });
    if (!size) {
      throw new NotFoundException(`Size with id ${size_id} not found`);
    }

    const variantProduct = variantProductFromArgs
      ? variantProductFromArgs
      : manager
        ? await manager.findOneBy(ProductVariant, { id: variant_product_id })
        : await this.productVariantRepository.findOneBy({
            id: variant_product_id,
          });

    if (!variantProduct) {
      throw new NotFoundException(
        `Variant of Product with id ${variant_product_id} not found`,
      );
    }

    if (
      stock === undefined ||
      stock === null ||
      isNaN(stock) ||
      stock <= 0 ||
      stock > 10000
    ) {
      throw new BadRequestException(
        'Stock must be a number greater than 0 and less than or equal to 10,000',
      );
    }

    const newVariantSize = manager
      ? manager.create(VariantSize, {
          stock,
          size,
          variantProduct,
        })
      : this.variantSizeRepository.create({
          stock,
          size,
          variantProduct,
        });

    const saved = manager
      ? await manager.save(newVariantSize)
      : await this.variantSizeRepository.save(newVariantSize);
    return instanceToPlain(saved);
  }

  async findAll() {
    const data = await this.variantSizeRepository.find({
      relations: ['size', 'variantProduct'],
    });
    return instanceToPlain(data);
  }

  async findOne(id: string) {
    const variantSize = await this.variantSizeRepository.findOne({
      where: { id },
      relations: ['size', 'variantProduct'],
    });
    if (!variantSize)
      throw new NotFoundException(`VariantSize with id ${id} not found`);
    return instanceToPlain(variantSize);
  }

  async update(id: string, updateDto: UpdateVariantSizeDto): Promise<any> {
    const exists = await this.variantSizeRepository.findOne({
      where: { id },
      relations: ['size', 'variantProduct'],
    });

    if (!exists) {
      throw new NotFoundException(`VariantSize with id ${id} not found`);
    }

    const size = updateDto.size_id
      ? await this.sizeRepository.findOneBy({ id: updateDto.size_id })
      : exists.size;

    if (!size) {
      throw new NotFoundException(
        `Size with id ${updateDto.size_id} not found`,
      );
    }

    if (
      updateDto.stock !== undefined &&
      (isNaN(updateDto.stock) ||
        updateDto.stock <= 0 ||
        updateDto.stock > 10000)
    ) {
      throw new BadRequestException(
        'Stock must be a number greater than 0 and less than or equal to 10,000',
      );
    }

    const updated = this.variantSizeRepository.create({
      ...exists,
      stock: updateDto.stock ?? exists.stock,
      size,
      variantProduct: exists.variantProduct,
    });

    const saved = await this.variantSizeRepository.save(updated);
    return instanceToPlain(saved);
  }

  async remove(id: string) {
    const exists = await this.variantSizeRepository.findOne({
    where: { id },
    withDeleted: false,
  });
    if (!exists)
      throw new NotFoundException(`VariantSize with id ${id} not found or already deleted`);
    await this.variantSizeRepository.update(id, { deleted_at: new Date() });
    return {
      message: `VariantSize with id ${id} deleted successfully`,
      deletedAt: new Date(),
    };
  }
}
