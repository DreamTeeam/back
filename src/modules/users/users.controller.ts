import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async softDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.softDeleteUser(id);
    return {
      statusCode: 200,
      message: 'The user account has been successfully locked.', 
    };
  }


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('deleted')
  async findDeleted() {
    return this.usersService.findDeletedUsers();
  }


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.restoreUser(id);
    return {
      statusCode: 200,
      message: 'The user account has been successfully restored.', 
    };
  }
}