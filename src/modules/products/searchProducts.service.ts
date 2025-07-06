import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectTenantRepository } from "src/common/typeorm-tenant-repository/tenant-repository.decorator";
import { Product } from "./entities/product.entity";
import { Repository, Brackets } from "typeorm";
import { instanceToPlain } from "class-transformer";

@Injectable()
export class ProductSearchService {
  constructor(
    @InjectTenantRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async searchProducts(query: string, color?: string): Promise<any> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('No hay resultados para tu búsqueda.');
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.color', 'color')
      .leftJoinAndSelect('variants.variantSizes', 'variantSizes')
      .leftJoinAndSelect('variantSizes.size', 'size');

    const keywords = query.split(/\s+/).filter(keyword => keyword.length > 0);

    if (keywords.length > 0) {
      queryBuilder.andWhere(new Brackets(qb => {
        keywords.forEach((keyword, index) => {
          const searchPattern = `%${keyword}%`;
          const condition = `
            brand.name ILIKE :keyword${index} OR
            product.description ILIKE :keyword${index} OR
            product.code ILIKE :keyword${index} OR
            category.name ILIKE :keyword${index} OR
            subCategory.name ILIKE :keyword${index} OR
            variants.description ILIKE :keyword${index} OR
            color.color ILIKE :keyword${index} OR
            CAST(size.size_us AS TEXT) ILIKE :keyword${index} OR
            CAST(size.size_eur AS TEXT) ILIKE :keyword${index} OR
            CAST(size.size_cm AS TEXT) ILIKE :keyword${index} OR
            CAST(product.sale_price AS TEXT) ILIKE :keyword${index}
          `;
          if (index === 0) {
            qb.where(condition, { [`keyword${index}`]: searchPattern });
          } else {
            qb.orWhere(condition, { [`keyword${index}`]: searchPattern });
          }
        });
      }));
    }

    if (color && color.trim() !== '') {
      queryBuilder.andWhere('color.color ILIKE :color', { color: `%${color}%` });
    }

    queryBuilder.take(50);

    const products = await queryBuilder.getMany();

    return instanceToPlain(products);
  }
}