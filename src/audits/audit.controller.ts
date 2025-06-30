import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auditorías')
@ApiBearerAuth()
@Controller('audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las auditorías' })
  getAll() {
    return this.auditService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Crear una auditoría' })
  @ApiBody({ type: CreateAuditDto })
  create(@Body() dto: CreateAuditDto, @Req() req: Request) {
    return this.auditService.create(dto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una auditoría por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAuditDto })
  update(@Param('id', ParseIntPipe) id: string, @Body() dto: UpdateAuditDto) {
    return this.auditService.update(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una auditoría por ID' })
  @ApiParam({ name: 'id', type: Number })
  getOne(@Param('id', ParseIntPipe) id: string) {
    return this.auditService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una auditoría por ID' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.auditService.remove(id);
  }
}







// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Param,
//   Body,
//   ParseIntPipe,
//   Delete,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { AuditService } from './audit.service';
// import { CreateAuditDto } from './create-auditDto';
// import { UpdateAuditDto } from './update-auditDto';
// import { Request } from 'express';
// import {
//   ApiTags,
//   ApiBearerAuth,
//   ApiOperation,
//   ApiParam,
//   ApiBody,
// } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport';

// @ApiTags('Auditorías')
// @ApiBearerAuth()
// @Controller('audits')
// export class AuditController {
//   constructor(private readonly auditService: AuditService) {}

//   @Get()
//   @ApiOperation({ summary: 'Obtener todas las auditorías' })
//   getAll() {
//     return this.auditService.findAll();
//   }

//   @Post()
//   @UseGuards(AuthGuard('jwt'))
//   @ApiOperation({ summary: 'Crear una auditoría' })
//   @ApiBody({ type: CreateAuditDto })
//   create(@Body() dto: CreateAuditDto, @Req() req: Request) {
//     return this.auditService.create(dto, req.user);
//   }

//   @Put(':id')
//   @ApiOperation({ summary: 'Actualizar una auditoría por ID' })
//   @ApiParam({ name: 'id', type: Number })
//   @ApiBody({ type: UpdateAuditDto })
//   update(
//     @Param('id', ParseIntPipe) id: string,
//     @Body() updateDto: UpdateAuditDto,
//   ) {
//     return this.auditService.update(id, updateDto);
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Obtener una auditoría por ID' })
//   @ApiParam({ name: 'id', type: Number })
//   getOne(@Param('id', ParseIntPipe) id: string) {
//     return this.auditService.findOne(id);
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Eliminar una auditoría por ID' })
//   @ApiParam({ name: 'id', type: Number })
//   remove(@Param('id', ParseIntPipe) id: string) {
//     return this.auditService.remove(id);
//   }
// }






// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Param,
//   Body,
//   ParseIntPipe,
//   Delete,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { AuditService } from './audit.service';
// import { CreateAuditDto } from './create-auditDto';
// import { UpdateAuditDto } from './update-auditDto';
// import { Request } from 'express';
// import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport';

// @ApiTags('Auditorías')
// @ApiBearerAuth()
// @Controller('audits')
// export class AuditController {
//   constructor(private readonly auditService: AuditService) {}

//   @Get()
//   @ApiOperation({ summary: 'Obtener todas las auditorías' })
//   getAll() {
//     return this.auditService.findAll();
//   }

//   @Post()
//   @UseGuards(AuthGuard('jwt'))
//   @ApiOperation({ summary: 'Crear una auditoría' })
//   @ApiBody({ type: CreateAuditDto })
//   create(@Body() dto: CreateAuditDto, @Req() req: Request) {
//     const token = req.headers.authorization?.split(' ')[1]; 
//     return this.auditService.create(dto, token);
//   }

//   @Put(':id')
//   @ApiOperation({ summary: 'Actualizar una auditoría por ID' })
//   @ApiParam({ name: 'id', type: Number })
//   @ApiBody({ type: UpdateAuditDto })
//   update(
//     @Param('id', ParseIntPipe) id: string,
//     @Body() updateDto: UpdateAuditDto,
//   ) {
//     return this.auditService.update(id, updateDto);
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Obtener una auditoría por ID' })
//   @ApiParam({ name: 'id', type: Number })
//   getOne(@Param('id', ParseIntPipe) id: string) {
//     return this.auditService.findOne(id);
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Eliminar una auditoría por ID' })
//   @ApiParam({ name: 'id', type: Number })
//   remove(@Param('id', ParseIntPipe) id: string) {
//     return this.auditService.remove(id);
//   }
// }







