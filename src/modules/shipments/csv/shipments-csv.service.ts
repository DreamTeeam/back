import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../entities/shipment.entity';
import { ShipmentVariant } from '../entities/shipment-variant.entity';
import { ShipmentSize } from '../entities/shipment-size.entity';
import * as csv from 'csv-parser';

@Injectable()
export class ShipmentsCsvService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentVariant)
    private readonly variantRepo: Repository<ShipmentVariant>,
    @InjectRepository(ShipmentSize)
    private readonly sizeRepo: Repository<ShipmentSize>,
  ) {}

 async createCsvFromDatabase(filename: string, code?: string, from?: string, to?: string): Promise<string> {
  const folderPath = path.join(__dirname, '../../../../temp');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const fechaActual = new Date().toISOString().split('T')[0];
  const filePath = path.join(folderPath, `${filename}_${fechaActual}.csv`);

  const header = [
    { id: 'codigo', title: 'Código' },
    { id: 'fecha', title: 'Fecha de embarque' },
    { id: 'cantidad', title: 'Cantidad productos' },
    { id: 'variantId', title: 'Variant ID' },
    { id: 'sizeId', title: 'Size ID' },
    { id: 'stock', title: 'Stock' },
  ];

  const query = this.shipmentRepo.createQueryBuilder('shipment')
    .leftJoinAndSelect('shipment.variants', 'variant')
    .leftJoinAndSelect('variant.sizes', 'size');

  if (code) {
    query.andWhere('shipment.shipmentCode ILIKE :code', { code: `%${code}%` });
  }

  if (from) {
    query.andWhere('shipment.shipmentDate >= :from', { from });
  }

  if (to) {
    query.andWhere('shipment.shipmentDate <= :to', { to });
  }

  const data = await query.getMany();

  const formattedData = data.flatMap((shipment) =>
  (shipment.variants || []).flatMap((variant) =>
    (variant.sizes || []).map((size) => ({
      codigo: shipment.shipmentCode,
      fecha: new Date(shipment.shipmentDate).toISOString().split('T')[0],
      cantidad: shipment.totalProducts,
      variantId: variant.variantId ?? '',
      sizeId: size.sizeId ?? '',
      stock: size.stock ?? '',
      }))
    )
  );

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header,
  });

  await csvWriter.writeRecords(formattedData);
  return filePath;
}


  async loadCsvToDatabase(file: Express.Multer.File): Promise<any> {
    const results: any[] = [];
    let inserted = 0;
    let duplicates = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          const groupedByCode = new Map();

          for (const row of results) {
            const code = row['Código'];
            if (!groupedByCode.has(code)) groupedByCode.set(code, []);
            groupedByCode.get(code).push(row);
          }

          for (const [code, rows] of groupedByCode.entries()) {
            const exists = await this.shipmentRepo.findOne({
              where: { shipmentCode: code },
            });

            if (exists) {
              duplicates++;
              console.log(`⚠️ Embarque duplicado: ${code}`);
              continue;
            }

            const shipment = this.shipmentRepo.create({
              shipmentCode: code,
              shipmentDate: new Date(rows[0]['Fecha de embarque']),
              totalProducts: Number(rows[0]['Cantidad productos']),
            });
            const savedShipment = await this.shipmentRepo.save(shipment);

            for (const row of rows) {
              const variant = this.variantRepo.create({
                shipment: savedShipment,
                variantId: Number(row['Variant ID']), 
              });
              const savedVariant = await this.variantRepo.save(variant);

              const size = this.sizeRepo.create({
                shipment: savedShipment,
                variant: savedVariant,
                stock: Number(row['Stock']),
                sizeId: Number(row['Size ID']),
              });
              await this.sizeRepo.save(size);
            }

            inserted++;
          }

          fs.unlinkSync(file.path);
          resolve({
            inserted,
            duplicates,
            message: 'CSV cargado correctamente',
          });
        })
        .on('error', (err) => {
          reject(`Error al procesar el CSV: ${err.message}`);
        });
    });
  }
}










// import { Injectable } from '@nestjs/common';
// import * as fs from 'fs';
// import * as path from 'path';
// import { createObjectCsvWriter } from 'csv-writer';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Shipment } from '../entities/shipment.entity';
// import * as csv from 'csv-parser';
// import { ShipmentVariant } from '../entities/shipment-variant.entity';
// import {shi}

// @Injectable()
// export class ShipmentsCsvService {
//   constructor(
//     @InjectRepository(Shipment)
//     private readonly shipmentRepo: Repository<Shipment>,
//     @InjectRepository(ShipmentVariant)
//     private readonly variantRepo: Repository<ShipmentVariant>,
//     @InjectRepository(ShipmentSize)
//     private readonly sizeRepo: Repository<ShipmentSize>,
//   ) {}

//   async createCsvFromDatabase(filename: string, code?: string, from?: string, to?: string): Promise<string> {
//     const folderPath = path.join(__dirname, '../../../../temp');
//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath);
//     }

//     const fechaActual = new Date().toISOString().split('T')[0];
//     const filePath = path.join(folderPath, `${filename}_${fechaActual}.csv`);

//     const header = [
//       { id: 'codigo', title: 'Código' },
//       { id: 'fecha', title: 'Fecha de embarque' },
//       { id: 'cantidad', title: 'Cantidad productos' },
//     ];

//     const query = this.shipmentRepo.createQueryBuilder('shipment');

//     if (code) {
//       query.andWhere('shipment.shipmentCode ILIKE :code', { code: `%${code}%` });
//     }

//     if (from) {
//       query.andWhere('shipment.shipmentDate >= :from', { from });
//     }

//     if (to) {
//       query.andWhere('shipment.shipmentDate <= :to', { to });
//     }

//     const data = await query.getMany();

//     const formattedData = data.map((shipment) => ({
//       codigo: shipment.shipmentCode,
//       fecha: new Date(shipment.shipmentDate).toISOString().split('T')[0],
//       cantidad: shipment.totalProducts,
//     }));

//     const csvWriter = createObjectCsvWriter({
//       path: filePath,
//       header: header,
//     });

//     await csvWriter.writeRecords(formattedData);
//     return filePath;
//   }

//  async loadCsvToDatabase(file: Express.Multer.File): Promise<string> {
//   const results: any[] = [];
//   let inserted = 0;
//   let duplicates = 0;

//   return new Promise((resolve, reject) => {
//     const stream = fs.createReadStream(file.path)
//       .pipe(csv())
//       .on('data', (data) => results.push(data))
//       .on('end', async () => {
//         for (const row of results) {
//           const existing = await this.shipmentRepo.findOne({
//             where: { shipmentCode: row['Código'] },
//           });

//           if (existing) {
//             duplicates++;
//             console.log(`⚠️ Embarque duplicado no insertado: ${row['Código']}`);
//             continue;
//           }

//           const shipment = this.shipmentRepo.create({
//             shipmentCode: row['Código'],
//             shipmentDate: new Date(row['Fecha de embarque']),
//             totalProducts: Number(row['Cantidad productos']),
//           });

//           await this.shipmentRepo.save(shipment);
//           inserted++;
//         }

//         fs.unlinkSync(file.path); 
//         resolve(`CSV cargado correctamente. Se insertaron ${inserted} embarques nuevos. Se ignoraron ${duplicates} duplicados.`);
//       })
//       .on('error', (err) => {
//         reject(`Error al procesar el CSV: ${err.message}`);
//       });
//   });
//  }}
