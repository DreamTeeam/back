// src/master_modules/auth/auth.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module'; // Importamos el módulo global de Usuarios
import { TenantsModule } from '../tenants/tenants.module'; // Importamos el módulo global de Tenants
import { TenantDataService } from './tenant-data.service'; // Un nuevo servicio para obtener datos específicos del tenant

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
    // Usamos forwardRef para evitar dependencias circulares si son necesarias
    forwardRef(() => UsersModule),
    forwardRef(() => TenantsModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    TenantDataService, // Añadimos el nuevo servicio
  ],
  exports: [AuthService],
})
export class AuthModule {}
