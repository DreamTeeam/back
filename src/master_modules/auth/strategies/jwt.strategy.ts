import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * This is the new structure of our JWT payload.
 * It's lean and contains only the essential info for security and routing.
 */
export interface JwtPayload {
  sub: string; // Global User ID
  tenantId: string; // ID of the tenant for the current session
  baseRole: string; // The base role: 'CLIENT', 'EMPLOYEE', or 'ADMIN'
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWTFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  private static extractJWTFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies.access_token) {
      return req.cookies.access_token;
    }
    return null;
  }

  //TODO LATER: We will inject UsersService here for a DB check, once it's created.
  /**
   * Passport first verifies the JWT's signature and then invokes this method.
   * For now, we validate that the payload has a user ID.
   * LATER: We will inject UsersService here for a DB check, once it's created.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    // This validated payload will be attached to the request as `req.user`
    return payload;
  }
}
