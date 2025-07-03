import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN', 'MANAGER', 'CASHIER')
  @Post()
  create(@Body() createDto: CreateCategoryDto) {
    return this.categoryService.create(createDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.findOne(id);
  }

  @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN', 'MANAGER', 'CASHIER')
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('ADMIN', 'SUPERADMIN', 'MANAGER', 'CASHIER')
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.delete(id);
  }

  @Get('slug/:slug') // NACHO
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }
}
