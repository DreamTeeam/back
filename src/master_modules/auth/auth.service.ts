// src/master_modules/auth/auth.service.ts

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { TenantDataService } from './tenant-data.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly tenantDataService: TenantDataService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Handles the unified login flow. Now accepts a userType to validate
   * that the user is logging in through the correct endpoint.
   */
  async login(
    loginDto: LoginDto,
    userType: 'CLIENT' | 'EMPLOYEE', // <-- CAMBIO: Parámetro añadido
  ): Promise<{ accessToken?: string; tenants?: any[]; message: string }> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let memberships = await this.tenantsService.findUserMemberships(user.id);

    if (memberships.length === 0) {
      throw new UnauthorizedException(
        'This user is not associated with any tenant.',
      );
    }

    // <-- CAMBIO: Filtrar las membresías según el tipo de login
    if (userType === 'EMPLOYEE') {
      memberships = memberships.filter(
        (m) => m.role === 'EMPLOYEE' || m.role === 'ADMIN',
      );
    } else {
      // userType === 'CLIENT'
      memberships = memberships.filter((m) => m.role === 'CLIENT');
    }

    if (memberships.length === 0) {
      throw new UnauthorizedException(
        `This user does not have a ${userType.toLowerCase()} role in any tenant.`,
      );
    }

    if (memberships.length === 1) {
      const { accessToken } = await this.generateTokenForTenant(
        user.id,
        memberships[0].tenant.id,
      );
      return { accessToken, message: 'Login successful' };
    } else {
      const tenantsList = memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
      }));
      return {
        tenants: tenantsList,
        message: 'Please select a tenant to continue.',
      };
    }
  }

  async generateTokenForTenant(
    userId: string,
    tenantId: string,
  ): Promise<{ accessToken: string }> {
    const membership = await this.tenantsService.findUserMembership(
      userId,
      tenantId,
    );
    if (!membership) {
      throw new UnauthorizedException(
        'User does not belong to the selected tenant.',
      );
    }

    const payload: JwtPayload = {
      sub: userId,
      tenantId: tenantId,
      baseRole: membership.role,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async publicRegisterClient(
    registerDto: RegisterDto,
    tenantSlug: string,
  ): Promise<Omit<User, 'password'>> {
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException(
        `Tenant with slug "${tenantSlug}" not found.`,
      );
    }
    return this.usersService.create(registerDto, tenant.id, 'CLIENT');
  }

  // --- CAMBIO: Métodos de registro interno ahora implementados ---

  /**
   * Handles internal registration of a client by a logged-in employee.
   */
  async internalRegisterClient(
    registerDto: RegisterDto,
    loggedInUser: JwtPayload,
  ): Promise<Omit<User, 'password'>> {
    const { tenantId } = loggedInUser;
    // We use the tenantId from the employee's token to register the new client
    return this.usersService.create(registerDto, tenantId, 'CLIENT');
  }

  /**
   * Handles registration of a new employee by a logged-in admin/manager.
   */
  async registerEmployee(
    registerDto: RegisterDto,
    loggedInUser: JwtPayload,
  ): Promise<Omit<User, 'password'>> {
    const { tenantId } = loggedInUser;
    // LATER: Here we would also handle the specific tenant_roles for the new employee
    return this.usersService.create(registerDto, tenantId, 'EMPLOYEE');
  }

  // LATER: Implement validateAndLoginGoogle

  async getProfile(payload: JwtPayload) {
    const { sub: userId, tenantId, baseRole } = payload;

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User from token not found.');

    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant)
      throw new UnauthorizedException('Tenant from token not found.');

    let tenant_roles: string[] = [];

    if (baseRole === 'EMPLOYEE' || baseRole === 'ADMIN') {
      tenant_roles = await this.tenantDataService.getEmployeeRoles(
        user.id,
        tenant,
      );
    }

    return {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      roles: [baseRole],
      tenant_roles: tenant_roles,
    };
  }
}
