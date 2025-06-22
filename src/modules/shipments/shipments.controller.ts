import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  Res,
  Query,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { UpdateShipmentDto } from './dtos/update-shipment.dto';
import { CreateShipmentDto } from './dtos/create-shipment.dto';
import { ShipmentsCsvService } from './csv/shipments-csv.service';
import { Response } from 'express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';



@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly csvService: ShipmentsCsvService,
  ) {}

  @Post()
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.shipmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.remove(id);
  }


@Get('csv/from-db')
async downloadCsvFromDb(
  @Query('filename') filename: string,
  @Query('code') code: string,
  @Query('from') from: string,
  @Query('to') to: string,
  @Res() res: Response
) {
  const filePath = await this.csvService.createCsvFromDatabase(filename || 'embarques', code, from, to);
  res.download(filePath, `${filename || 'embarques'}.csv`);
}



@Post('csv/upload')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './temp',
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
  }),
)
async uploadCsv(
  @UploadedFile() file: Express.Multer.File,
) {
  return this.csvService.loadCsvToDatabase(file);
}




}