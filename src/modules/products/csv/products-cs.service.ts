import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import * as csv from 'csv-parser';

@Injectable()
export class ProductsCsvService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async exportPricesToCsv(): Promise<string> {
    const folderPath = path.join(__dirname, '../../../../../temp');
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const fecha = new Date().toISOString().split('T')[0];
    const filePath = path.join(folderPath, `precios_productos_${fecha}.csv`);

    const header = [
      { id: 'code', title: 'Código' },
      { id: 'name', title: 'Nombre' },
      { id: 'purchase', title: 'Precio compra' },
      { id: 'sale', title: 'Precio venta' },
    ];

    const products = await this.productRepo.find();

    const data = products.map((p) => ({
      code: p.code,
      name: p.name,
      purchase: p.purchase_price,
      sale: p.sale_price,
    }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header,
    });

    await csvWriter.writeRecords(data);

    return filePath;
  }


  async loadCsvToUpdatePrices(file: Express.Multer.File): Promise<any> {
  const results: any[] = [];
  let updated = 0;
  let notFound = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          const product = await this.productRepo.findOne({
            where: { code: row['code'] },
          });

          if (!product) {
            notFound++;
            continue;
          }

          product.purchase_price = parseFloat(row['purchase_price']);
          product.sale_price = parseFloat(row['sale_price']);
          await this.productRepo.save(product);
          updated++;
        }

        fs.unlinkSync(file.path); 
        resolve({
          updated,
          notFound,
          message: 'Precios actualizados desde CSV.',
        });
      })
      .on('error', (err) => {
        reject(`Error al procesar el CSV: ${err.message}`);
      });
  });
}

}
