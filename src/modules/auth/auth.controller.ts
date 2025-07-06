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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //& --- RUTAS DE CLIENTES ---

  @Post('client/login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = await this.authService.clientLogin(loginDto);
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
    return { message: 'Login successful' };
  }

  @Post('client/register')
  @HttpCode(HttpStatus.CREATED)
  registerClient(
    @Body(new ValidationPipe()) registerClientDto: RegisterClientDto,
  ) {
    return this.authService.registerClient(registerClientDto);
  }

  @Get('client/google')
  @UseGuards(AuthGuard('google-client'))
  async clientGoogleAuth(@Req() req: Request) {}

  @Get('client/google/callback')
  @UseGuards(AuthGuard('google-client'))
  async clientGoogleAuthRedirect(
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const userFromGoogle = req.user as any;
    const accessToken =
      await this.authService.validateAndLoginOrCreateClient(userFromGoogle);

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.redirect(
      'http://localhost:3000/auth/success?from=google&type=client',
    );
  }

  //& --- RUTAS DE EMPLEADOS ---

  @Post('employee/register')
  //@UseGuards(AuthGuard('jwt'), RolesGuard)
  //@Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  registerEmployee(
    @Body(new ValidationPipe()) registerEmployeeDto: RegisterEmployeeDto,
  ) {
    return this.authService.registerEmployee(registerEmployeeDto);
  }

  @Post('employee/login')
  @HttpCode(HttpStatus.OK)
  async employeeLogin(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = await this.authService.employeeLogin(loginDto);
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      //secure: false, // <--- En desarrollo esto debe estar en false
      // secure: process.env.NODE_ENV === 'production', <---- esto en desarrollo debe estar comentado
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { message: 'Login successful' };
  }

  @Get('employee/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {}

  @Get('employee/google/callback')
  @UseGuards(AuthGuard('google'))
  async employeeGoogleAuthRedirect(
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const userFromGoogle = req.user as { email: string };
    const accessToken =
      await this.authService.validateAndLoginGoogleEmployee(userFromGoogle);
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      //secure: false, // <--- En desarrollo esto debe estar en false
      // secure: process.env.NODE_ENV === 'production', <---- esto en desarrollo debe estar comentado
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.redirect(
      'http:/localhost:3000/auth/success?from=google&type=employee',
    );
  }

  //% 1. Método login con jwt Token
  // @Post('login')
  // @HttpCode(HttpStatus.OK)
  // login(@Body(new ValidationPipe()) loginDto: LoginDto) {
  //   return this.authService.login(loginDto);
  // }

  //& --- RUTA DE LOGOUT ---
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Logout successful' };
  }

  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
