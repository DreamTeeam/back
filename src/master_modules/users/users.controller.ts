import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

//TODO LATER: This controller will be built out to manage users
// LATER: This controller will be built out to manage users
// (e.g., for a super-admin panel to view all users in the platform).
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt')) // Example of protecting a future route
  findAll() {
    return {
      message:
        'This endpoint will list all users for super-admins in the future.',
    };
  }
}
