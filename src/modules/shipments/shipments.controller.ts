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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Embarques')
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly csvService: ShipmentsCsvService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un embarque con variantes y talles' })
  @ApiBody({ type: CreateShipmentDto })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los embarques' })
  findAll() {
    return this.shipmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un embarque por ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un embarque por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateShipmentDto })
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un embarque por ID' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.shipmentsService.remove(id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('csv/from-db')
  @ApiOperation({ summary: 'Descargar CSV de embarques desde la base de datos' })
  @ApiQuery({ name: 'filename', required: false })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
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
  @ApiOperation({ summary: 'Cargar datos de embarques desde un archivo CSV' })
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