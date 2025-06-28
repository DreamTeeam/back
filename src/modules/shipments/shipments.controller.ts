import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { UpdateShipmentDto } from './dtos/update-shipment.dto';
import { CreateShipmentDto } from './dtos/create-shipment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ShipmentsCsvService } from './csv/shipments-csv.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

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
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.shipmentsService.remove(id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('csv/from-db')
  async downloadCsvFromDb(
    @Query('filename') filename: string,
    @Query('code') code: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const filePath = await this.csvService.createCsvFromDatabase(
      filename || 'embarques',
      code,
      from,
      to,
    );
    res.download(filePath, `${filename || 'embarques'}.csv`);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
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
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    return this.csvService.loadCsvToDatabase(file);
  }
}

// import {
//   Body,
//   Controller,
//   Get,
//   Post,
//   Param,
//   Put,
//   Delete,
//   ParseIntPipe,
//   UseInterceptors,
//   UploadedFile,
//   Res,
//   Query,
// } from '@nestjs/common';
// import { ShipmentsService } from './shipments.service';
// import { UpdateShipmentDto } from './dtos/update-shipment.dto';
// import { CreateShipmentDto } from './dtos/create-shipment.dto';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { Response } from 'express';
// import { ShipmentsCsvService } from './csv/shipments-csv.service';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import { UseGuards } from '@nestjs/common';
// import { ApiBearerAuth } from '@nestjs/swagger';
// import { AuthGuard } from '../auth/guards/auth.guard';
// @Controller('shipments')
// export class ShipmentsController {
//   constructor(
//     private readonly shipmentsService: ShipmentsService,
//     private readonly csvService: ShipmentsCsvService
//   ) {}

//   @Post()
//   create(@Body() dto: CreateShipmentDto) {
//     return this.shipmentsService.create(dto);
//   }

//   @Get()
//   findAll() {
//     return this.shipmentsService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.shipmentsService.findOne(id);
//   }

//   @Put(':id')
//   update(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() dto: UpdateShipmentDto,
//   ) {
//     return this.shipmentsService.update(id, dto);
//   }

//   @Delete(':id')
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.shipmentsService.remove(id);
//   }

//  @Get('csv/from-db')
// async downloadCsvFromDb(
//   @Query('filename') filename: string,
//   @Query('code') code: string,
//   @Query('from') from: string,
//   @Query('to') to: string,
//   @Res() res: Response
// ) {
//   const filePath = await this.csvService.createCsvFromDatabase(filename || 'embarques', code, from, to);
//   res.download(filePath, `${filename || 'embarques'}.csv`);
// }

// @Post('csv/upload')
// @UseInterceptors(
//   FileInterceptor('file', {
//     storage: diskStorage({
//       destination: './temp',
//       filename: (req, file, cb) => {
//         const uniqueName = `${Date.now()}${extname(file.originalname)}`;
//         cb(null, uniqueName);
//       },
//     }),
//   }),
// )
// async uploadCsv(
//   @UploadedFile() file: Express.Multer.File,
// ) {
//   return this.csvService.loadCsvToDatabase(file);
// }

// }
