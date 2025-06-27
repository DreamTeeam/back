// src/master_modules/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Get,
  Req,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
// LATER: We will import and use RolesGuard for internal registration endpoints.

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- RUTAS DE CLIENTES (INTACTAS PARA EL FRONTEND) ---

  @Post('client/login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // The endpoint is the same, but it calls the new unified service
    // We pass an extra parameter to specify the expected user type for validation.
    const loginResult = await this.authService.login(loginDto, 'CLIENT');

    if (loginResult.accessToken) {
      response.cookie('access_token', loginResult.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });
    }
    return loginResult;
  }

  /**
   * This endpoint is now for internal use: an employee registering a client.
   */
  @Post('client/register')
  @UseGuards(AuthGuard('jwt')) // This route is now protected
  @HttpCode(HttpStatus.CREATED)
  registerClient(
    @Req() req: Request,
    @Body(new ValidationPipe()) registerDto: RegisterDto,
  ) {
    const loggedInUser = req.user as JwtPayload;
    // We call the specific service method for this flow
    return this.authService.internalRegisterClient(registerDto, loggedInUser);
  }

  // --- RUTAS DE EMPLEADOS (INTACTAS PARA EL FRONTEND) ---

  @Post('employee/login')
  @HttpCode(HttpStatus.OK)
  async employeeLogin(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Same endpoint, but calls the new unified service with a different type
    const loginResult = await this.authService.login(loginDto, 'EMPLOYEE');

    if (loginResult.accessToken) {
      response.cookie('access_token', loginResult.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });
    }
    return loginResult;
  }

  /**
   * Endpoint for an Admin/Manager to register a new employee.
   */
  @Post('employee/register')
  @UseGuards(AuthGuard('jwt')) // This route must be protected
  // LATER: @UseGuards(RolesGuard) @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  registerEmployee(
    @Req() req: Request,
    @Body(new ValidationPipe()) registerDto: RegisterDto,
  ) {
    const loggedInUser = req.user as JwtPayload;
    return this.authService.registerEmployee(registerDto, loggedInUser);
  }

  // --- NUEVAS RUTAS (FUNCIONALIDAD ADITIVA) ---

  /**
   * NEW public endpoint for clients to register themselves.
   */
  @Post('public/register/:tenantSlug')
  @HttpCode(HttpStatus.CREATED)
  publicRegisterClient(
    @Param('tenantSlug') tenantSlug: string,
    @Body(new ValidationPipe()) registerDto: RegisterDto,
  ) {
    return this.authService.publicRegisterClient(registerDto, tenantSlug);
  }

  // LATER: The select-tenant and google auth endpoints will be added here
  // once the core logic is fully implemented and tested.

  // --- RUTAS COMUNES (INTACTAS) ---

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    // This logic doesn't need to change.
    response.clearCookie('access_token');
    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    // The only internal change: we call the service to build the rich response.
    // The frontend gets the same data structure (or more, with tenant_roles),
    // so it's a non-breaking change.
    return this.authService.getProfile(req.user as JwtPayload);
  }
}
